-- QuetzalShip Database Initialization Script
-- Creates database and tables if they don't exist

-- Wait for SQL Server to be ready
WAITFOR DELAY '00:00:05';

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'quetzalship')
BEGIN
    CREATE DATABASE quetzalship;
    PRINT 'Database quetzalship created successfully';
END
ELSE
BEGIN
    PRINT 'Database quetzalship already exists';
END
GO

USE quetzalship;
GO

-- Create orders table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'orders')
BEGIN
    CREATE TABLE orders (
        id NVARCHAR(36) PRIMARY KEY,
        client_name NVARCHAR(255) NOT NULL,
        origin_zone NVARCHAR(50) NOT NULL,
        destination_zone NVARCHAR(50) NOT NULL,
        service_type NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        total_weight_kg DECIMAL(10, 2),
        base_cost DECIMAL(10, 2),
        weight_cost DECIMAL(10, 2),
        zone_surcharge DECIMAL(10, 2),
        fragile_surcharge DECIMAL(10, 2),
        express_surcharge DECIMAL(10, 2),
        insurance_cost DECIMAL(10, 2),
        subtotal DECIMAL(10, 2),
        tax DECIMAL(10, 2),
        total DECIMAL(10, 2),
        discount_type NVARCHAR(20),
        discount_value DECIMAL(10, 2),
        discount_amount DECIMAL(10, 2),
        insurance_enabled BIT DEFAULT 0,
        estimated_delivery_date DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table orders created successfully';
END
ELSE
BEGIN
    PRINT 'Table orders already exists';
END
GO

-- Create packages table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'packages')
BEGIN
    CREATE TABLE packages (
        id NVARCHAR(36) PRIMARY KEY,
        order_id NVARCHAR(36) NOT NULL,
        weight_kg DECIMAL(10, 2) NOT NULL,
        height_cm INT NOT NULL,
        width_cm INT NOT NULL,
        length_cm INT NOT NULL,
        fragile BIT DEFAULT 0,
        declared_value_q DECIMAL(10, 2),
        volumetric_weight DECIMAL(10, 2),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    PRINT 'Table packages created successfully';
END
ELSE
BEGIN
    PRINT 'Table packages already exists';
END
GO

-- Create index for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_status')
BEGIN
    CREATE INDEX idx_orders_status ON orders(status);
    PRINT 'Index idx_orders_status created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_created_at')
BEGIN
    CREATE INDEX idx_orders_created_at ON orders(created_at);
    PRINT 'Index idx_orders_created_at created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_packages_order_id')
BEGIN
    CREATE INDEX idx_packages_order_id ON packages(order_id);
    PRINT 'Index idx_packages_order_id created';
END
GO

PRINT 'QuetzalShip database initialization complete!';
GO
