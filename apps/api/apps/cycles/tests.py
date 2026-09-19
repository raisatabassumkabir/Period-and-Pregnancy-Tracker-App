from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

class CycleInitTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/cycles/init/"

    def test_init_cycle_success(self):
        payload = {
            "start_date": "2026-09-01"
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["start_date"], "2026-09-01")
        
        # Verify idempotency if called twice
        response_2 = self.client.post(self.url, payload, format="json")
        self.assertEqual(response_2.status_code, status.HTTP_201_CREATED)
