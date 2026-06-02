from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import User
from app.security import get_current_user


def make_user(email: str, name: str) -> User:
    return User(
        email=email,
        name=name,
        hashed_password="test",
        email_verified=True,
        created_at=datetime.now(timezone.utc),
    )


def _setup(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    owner = make_user("owner@example.com", "Owner")
    classmate = make_user("mate@example.com", "Classmate")
    with TestingSessionLocal() as db:
        db.add_all([owner, classmate])
        db.commit()
        db.refresh(owner)
        db.refresh(classmate)
        ids = {"owner": owner.id, "classmate": classmate.id}

    state = {"active": ids["owner"]}

    def override_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def override_current_user():
        with TestingSessionLocal() as db:
            return db.get(User, state["active"])

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user
    return TestClient(app), ids, state, override_current_user


def test_email_invite_grants_view_access_and_blocks_editing(tmp_path):
    client, ids, state, _auth = _setup(tmp_path)
    try:
        task = client.post("/tasks", json={"title": "Read chapter 4", "priority": "medium"}).json()

        invite = client.post(
            f"/tasks/{task['id']}/collaborators/invite",
            json={"email": "mate@example.com", "role": "viewer"},
        )
        assert invite.status_code == 201
        token = invite.json()["token"]

        # Classmate accepts the email invite.
        state["active"] = ids["classmate"]
        accepted = client.post(f"/task-invites/{token}/accept")
        assert accepted.status_code == 200
        body = accepted.json()
        assert body["role"] == "viewer"
        assert body["shared_with_me"] is True

        # T-33: appears in the classmate's task list as shared-with-me.
        listing = client.get("/tasks").json()
        assert [t["id"] for t in listing] == [task["id"]]
        assert listing[0]["shared_with_me"] is True

        # T-35: a viewer cannot edit the task (404 — access hidden, not editable).
        denied = client.patch(f"/tasks/{task['id']}", json={"title": "Hacked"})
        assert denied.status_code == 404

        # T-35: a viewer cannot re-share the task.
        reshare = client.post(
            f"/tasks/{task['id']}/collaborators/invite",
            json={"email": "third@example.com", "role": "viewer"},
        )
        assert reshare.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_editor_invite_allows_editing(tmp_path):
    client, ids, state, _auth = _setup(tmp_path)
    try:
        task = client.post("/tasks", json={"title": "Group essay", "priority": "high"}).json()
        invite = client.post(
            f"/tasks/{task['id']}/collaborators/invite",
            json={"email": "mate@example.com", "role": "editor"},
        ).json()

        state["active"] = ids["classmate"]
        client.post(f"/task-invites/{invite['token']}/accept")
        edit = client.patch(f"/tasks/{task['id']}", json={"completed": True})
        assert edit.status_code == 200
        assert edit.json()["completed"] is True
    finally:
        app.dependency_overrides.clear()


def test_share_link_redeem_revoke_and_preview(tmp_path):
    client, ids, state, auth = _setup(tmp_path)
    try:
        task = client.post("/tasks", json={"title": "Lab notes", "priority": "low"}).json()

        link = client.post(f"/tasks/{task['id']}/share-links", json={"role": "viewer"})
        assert link.status_code == 201
        token = link.json()["token"]

        # T-34: public, unauthenticated preview works (no auth override).
        app.dependency_overrides.pop(get_current_user, None)
        preview = client.get(f"/share/{token}")
        assert preview.status_code == 200
        assert preview.json()["title"] == "Lab notes"
        assert preview.json()["owner_name"] == "Owner"

        # Re-enable auth as the classmate and redeem the link.
        app.dependency_overrides[get_current_user] = auth
        state["active"] = ids["classmate"]
        redeemed = client.post(f"/share/{token}/accept")
        assert redeemed.status_code == 200
        assert redeemed.json()["role"] == "viewer"
        assert client.get(f"/tasks/{task['id']}").status_code == 200

        # Owner revokes the link; preview now fails and the link is gone from the list.
        state["active"] = ids["owner"]
        link_id = client.get(f"/tasks/{task['id']}/share-links").json()[0]["id"]
        revoke = client.delete(f"/tasks/{task['id']}/share-links/{link_id}")
        assert revoke.status_code == 204
        assert client.get(f"/tasks/{task['id']}/share-links").json() == []

        app.dependency_overrides.pop(get_current_user, None)
        assert client.get(f"/share/{token}").status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_owner_can_revoke_collaborator(tmp_path):
    client, ids, state, _auth = _setup(tmp_path)
    try:
        task = client.post("/tasks", json={"title": "Shared task", "priority": "medium"}).json()
        invite = client.post(
            f"/tasks/{task['id']}/collaborators/invite",
            json={"email": "mate@example.com", "role": "viewer"},
        ).json()
        state["active"] = ids["classmate"]
        client.post(f"/task-invites/{invite['token']}/accept")

        # Owner revokes access.
        state["active"] = ids["owner"]
        members = client.get(f"/tasks/{task['id']}/collaborators").json()
        assert {m["role"] for m in members} == {"owner", "viewer"}
        revoke = client.delete(f"/tasks/{task['id']}/collaborators/{ids['classmate']}")
        assert revoke.status_code == 204

        # Classmate loses visibility.
        state["active"] = ids["classmate"]
        assert client.get("/tasks").json() == []
        assert client.get(f"/tasks/{task['id']}").status_code == 404
    finally:
        app.dependency_overrides.clear()
