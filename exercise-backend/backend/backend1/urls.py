from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, LoginAPIView, RegisterAPIView, UserView, LogoutView, SaveWorkOutView, ValidateTokenView, UserPlannedWorkoutsView, UserSavedWorkoutsView, SigninWIthApple, VerifyOTPAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

# Using `router.register(r'exercises', ExerciseViewSet)` registers the `ExerciseViewSet` with the router,
# which automatically creates all the CRUD (Create, Read, Update, Delete) operation URLs for your `Exercise` model.
# Accessing `/exercises/` will now allow clients to perform these operations as allowed by your viewset configuration.
router = DefaultRouter()


router.register(r'exercises', ExerciseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('saveWorkOuts', SaveWorkOutView.as_view(), name = 'saveWorkout'),
    path('login/', LoginAPIView.as_view()),
    path('user/', UserView.as_view()),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp'),
    path('social-login/', SigninWIthApple.as_view(), name='social-login'),
    path('logout/', LogoutView.as_view()),
    path('validate-token/', ValidateTokenView.as_view(), name='validate_token'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('userSavedWorkouts/', UserSavedWorkoutsView.as_view(), name= 'userSavedWorkOuts'),
    path('plannedWorkouts/', UserPlannedWorkoutsView.as_view(), name='planned_workouts'),

]
