# tests/factories.py
from typing import Any, cast

import factory
from factory.declarations import LazyFunction, PostGeneration, Sequence
from faker import Faker

# Modelos
from app.users.models import User
from app.roles.models import Role
from app.core.security import hash_password


# Faker en español
fake = Faker("es_ES")


# ==============================
# BASE FACTORY
# ==============================
class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):
    """
    Factory base para todas las factories.

    La sesión se inyecta desde pytest fixtures.
    """

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        abstract = True
        sqlalchemy_session = None  # 👈 se asigna dinámicamente
        sqlalchemy_session_persistence = "flush"


# ==============================
# ROLE FACTORY
# ==============================
class RoleFactory(BaseFactory):
    """
    Factory del modelo Role.
    """

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = Role

    id = Sequence(lambda n: n + 1)
    name = Sequence(lambda n: f"role_{n}")
    description = LazyFunction(lambda: fake.sentence())


# ==============================
# USER FACTORY
# ==============================
class UserFactory(BaseFactory):
    """
    Factory del modelo User.
    """

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = User

    id = Sequence(lambda n: n + 1)
    full_name = LazyFunction(lambda: fake.name())
    email = Sequence(lambda n: f"user{n}@test.com")

    # contraseña válida para login tests
    hashed_password = LazyFunction(lambda: hash_password("testpassword"))

    is_active = True

    # --------------------------
    # RELACIÓN MANY TO MANY
    # --------------------------
    @staticmethod
    def _attach_roles(instance: User, create: bool, extracted: Any, **kwargs: Any) -> None:
        if not create:
            return

        if extracted:
            cast(list[Role], instance.roles).extend(list(extracted))

    roles = PostGeneration(_attach_roles)


# ==============================
# STUDENT USER FACTORY
# ==============================
class StudentUserFactory(UserFactory):
    """
    Usuario tipo estudiante.
    (La asignación real del rol debe hacerse en fixtures)
    """

    pass
