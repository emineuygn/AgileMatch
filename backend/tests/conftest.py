import os
import tempfile
from pathlib import Path

_db_file = Path(tempfile.mkdtemp()) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file}"
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 32
os.environ["ADMIN_EMAIL"] = "ik@sirket.com"
os.environ["ADMIN_PASSWORD"] = "test-password"
os.environ["CORS_ORIGINS"] = "https://agilematch.vercel.app"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from scripts.seed_data import seed_admin, seed_demo


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_admin(db)
        seed_demo(db)
        db.commit()


@pytest.fixture
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture
def anon():
    return TestClient(app)


@pytest.fixture
def client(anon):
    res = anon.post("/auth/login", json={"email": "ik@sirket.com", "password": "test-password"})
    assert res.status_code == 200
    return TestClient(app, headers={"Authorization": f"Bearer {res.json()['access_token']}"})
