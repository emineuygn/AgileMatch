from logging.config import fileConfig

from alembic import context

from app.database import Base, engine
import app.models  # noqa: F401  (tablolar Base.metadata'ya kaydolur)

if context.config.config_file_name:
    fileConfig(context.config.config_file_name)

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()
    connection.commit()
