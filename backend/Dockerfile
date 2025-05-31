FROM ros:humble

# Install system deps
RUN apt update && apt install -y \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
RUN pip3 install fastapi uvicorn

# Copy app
WORKDIR /app
COPY main.py .

# Source ROS on startup
ENV ROS_DOMAIN_ID=0
ENV RMW_IMPLEMENTATION=rmw_fastrtps_cpp
SHELL ["/bin/bash", "-c"]
RUN echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
