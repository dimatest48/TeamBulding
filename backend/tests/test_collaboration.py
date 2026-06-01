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


def test_subject_invite_acceptance_shares_subject_tasks(tmp_path):
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
        owner_id = owner.id
        classmate_id = classmate.id

    active_user_id = owner_id

    def override_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def override_current_user():
        with TestingSessionLocal() as db:
            return db.get(User, active_user_id)

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user

    try:
        client = TestClient(app)
        subject = client.post("/subjects", json={"name": "Team Project", "color": "#6366f1"}).json()
        task = client.post(
            "/tasks",
            json={"title": "Prepare demo", "priority": "high", "subject_id": subject["id"]},
        )
        assert task.status_code == 201

        invite = client.post(
            f"/subjects/{subject['id']}/invites",
            json={"email": "mate@example.com", "role": "editor"},
        )
        assert invite.status_code == 201
        token = invite.json()["token"]

        active_user_id = classmate_id
        accepted = client.post(f"/invites/{token}/accept")
        assert accepted.status_code == 200
        assert accepted.json()["shared"] is True

        tasks = client.get("/tasks")
        assert tasks.status_code == 200
        assert [item["title"] for item in tasks.json()] == ["Prepare demo"]
    finally:
        app.dependency_overrides.clear()
