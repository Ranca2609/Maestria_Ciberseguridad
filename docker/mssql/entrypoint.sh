#!/bin/bash
# MSSQL Entrypoint Script

# Start SQL Server in background
/opt/mssql/bin/sqlservr &
pid=$!

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to start..."

# Check if SQL Server is ready
for i in {1..60}
do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "SQL Server is ready!"
        break
    else
        echo "SQL Server not ready yet... waiting ($i/60)"
        sleep 2
    fi
done

# Run initialization script
echo "Running initialization script..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i init.sql
if [ $? -eq 0 ]; then
    echo "Initialization complete!"
else
    echo "Initialization failed"
fi

# Wait for the SQL Server process to finish
wait $pid
