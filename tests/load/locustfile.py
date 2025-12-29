# Locustfile for QuetzalShip Load Testing
# Run with: locust -f locustfile.py --host http://localhost:3000

from locust import HttpUser, task, between, events
import random
import uuid
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuetzalShipUser(HttpUser):
    """
    Simulates a typical user interacting with QuetzalShip API.
    
    Task weights:
    - list_orders (5): Most common operation - browsing orders
    - create_order (3): Frequent operation - creating new shipments  
    - health_check (2): Regular health checks
    - get_fx_rate (1): Occasional currency lookups
    """
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    # Store created order IDs for subsequent operations
    created_orders = []
    
    def on_start(self):
        """Called when a simulated user starts"""
        # Warm up with a health check
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                logger.info("User started - health check passed")
            else:
                logger.warning(f"Health check failed with status {response.status_code}")
    
    @task(3)
    def create_order(self):
        """Create a new shipping order"""
        correlation_id = str(uuid.uuid4())
        idempotency_key = str(uuid.uuid4())
        
        payload = {
            #"clientName": f"Load Test User {random.randint(1, 1000)}",
            "originZone": random.choice(["METRO", "INTERIOR", "FRONTERA"]),
            "destinationZone": random.choice(["METRO", "INTERIOR", "FRONTERA"]),
            "serviceType": random.choice(["STANDARD", "EXPRESS", "SAME_DAY"]),
            "packages": self._generate_packages(),
            "insuranceEnabled": random.choice([True, False])
        }
        
        with self.client.post(
            "/v1/orders",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
                "X-Correlation-ID": correlation_id
            },
            name="/v1/orders [POST]",
            catch_response=True
        ) as response:
            if response.status_code == 201:
                try:
                    order_id = response.json().get("orderId")
                    if order_id:
                        self.created_orders.append(order_id)
                        # Keep only last 100 orders to avoid memory issues
                        if len(self.created_orders) > 100:
                            self.created_orders = self.created_orders[-100:]
                except:
                    pass
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(5)
    def list_orders(self):
        """List orders with pagination"""
        page = random.randint(1, 5)
        page_size = random.choice([10, 20, 50])
        
        with self.client.get(
            f"/v1/orders?page={page}&pageSize={page_size}",
            headers={"X-Correlation-ID": str(uuid.uuid4())},
            name="/v1/orders [GET]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(2)
    def get_order_details(self):
        """Get details for a specific order"""
        if not self.created_orders:
            return  # Skip if no orders created yet
        
        order_id = random.choice(self.created_orders)
        
        with self.client.get(
            f"/v1/orders/{order_id}",
            headers={"X-Correlation-ID": str(uuid.uuid4())},
            name="/v1/orders/:id [GET]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # Order might have been cleaned up
                self.created_orders.remove(order_id)
                response.success()  # Not a real failure
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(1)
    def get_receipt(self):
        """Get receipt for an order"""
        if not self.created_orders:
            return
        
        order_id = random.choice(self.created_orders)
        
        with self.client.get(
            f"/v1/orders/{order_id}/receipt",
            headers={"X-Correlation-ID": str(uuid.uuid4())},
            name="/v1/orders/:id/receipt [GET]",
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(2)
    def health_check(self):
        """Check service health"""
        with self.client.get("/health", name="/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed with {response.status_code}")
    
    @task(1)
    def get_fx_rate(self):
        """Get exchange rate from FX service"""
        currencies = ["GTQ", "EUR", "MXN", "GBP", "CAD", "JPY"]
        to_currency = random.choice(currencies)
        
        with self.client.get(
            f"/api/v1/fx/rates?from=USD&to={to_currency}",
            headers={"X-Correlation-ID": str(uuid.uuid4())},
            name="/api/v1/fx/rates [GET]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # FX service might not be deployed
                response.success()
            else:
                response.failure(f"FX rate failed with {response.status_code}")
    
    def _generate_packages(self):
        """Generate random package data"""
        num_packages = random.randint(1, 3)
        packages = []
        
        for _ in range(num_packages):
            packages.append({
                "weightKg": round(random.uniform(0.5, 50), 2),
                "heightCm": random.randint(5, 100),
                "widthCm": random.randint(5, 100),
                "lengthCm": random.randint(5, 100),
                "fragile": random.choice([True, False]),
                "declaredValueQ": random.randint(50, 10000)
            })
        
        return packages


# Event handlers for reporting
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    logger.info("Load test starting...")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    logger.info("Load test completed!")
    logger.info(f"Total requests: {environment.stats.total.num_requests}")
    logger.info(f"Failure rate: {environment.stats.total.fail_ratio * 100:.2f}%")
    logger.info(f"Avg response time: {environment.stats.total.avg_response_time:.2f}ms")
