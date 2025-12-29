FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Install mssql-tools18 and unixODBC developer
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl https://packages.microsoft.com/keys/microsoft.asc | tee /etc/apt/trusted.gpg.d/microsoft.asc && \
    curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | tee /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

# Add mssql-tools to PATH
ENV PATH="$PATH:/opt/mssql-tools18/bin"

# Create directory for scripts
WORKDIR /usr/src/app

# Copy scripts
COPY entrypoint.sh .
COPY init.sql .

# Fix permissions
RUN chmod +x entrypoint.sh

USER mssql

ENTRYPOINT ["./entrypoint.sh"]
