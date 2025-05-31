import rclpy
from rclpy.node import Node
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from urllib.parse import unquote, quote
import re

app: FastAPI = FastAPI()
rclpy.init()

# Minimal node to introspect the graph
introspection_node = rclpy.create_node('ros2_graph_api_node')

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_topic_name(name: str) -> str:
    # Remove multiple consecutive slashes and ensure single leading slash
    normalized = re.sub(r'/+', '/', name)
    # Ensure the topic starts with a single slash
    if not normalized.startswith('/'):
        normalized = '/' + normalized
    return normalized

@app.get("/topics")
def get_topic_list():
    topic_names_and_types = introspection_node.get_topic_names_and_types()
    return [
        {
            "name": normalize_topic_name(name),
            "types": types,
            "encoded_name": quote(normalize_topic_name(name))
        }
        for name, types in topic_names_and_types
    ]


@app.get("/topics/{topic_name:path}")
def get_topic_info(topic_name: str):
    try:
        # Decode the URL-encoded topic name and normalize it
        decoded_topic_name = normalize_topic_name(unquote(topic_name))
        print(f"Decoded topic name: {decoded_topic_name}")  # Debug print
        
        publishers = introspection_node.get_publishers_info_by_topic(decoded_topic_name)
        subscriptions = introspection_node.get_subscriptions_info_by_topic(decoded_topic_name)

        return {
            "topic": decoded_topic_name,
            "encoded_topic": quote(decoded_topic_name),
            "publishers": [
                {
                    "node_name": info.node_name,
                    "node_namespace": info.node_namespace,
                    "topic_type": info.topic_type,
                } for info in publishers
            ],
            "subscribers": [
                {
                    "node_name": info.node_name,
                    "node_namespace": info.node_namespace,
                    "topic_type": info.topic_type,
                } for info in subscriptions
            ],
        }
    except Exception as e:
        print(f"Error processing topic {topic_name}: {str(e)}")  # Debug print
        return {"error": str(e)}


@app.get("/nodes")
def get_node_list():
    node_names = introspection_node.get_node_names()
    print("Raw node names from ROS 2:", node_names)  # Debug print
    
    # Create a set of unique node identifiers to avoid duplicates
    unique_nodes = set()
    nodes = []
    
    for name in node_names:
        node_name = name.split('/')[-1]
        namespace = '/'.join(name.split('/')[:-1]) or '/'
        node_id = f"{namespace}/{node_name}"
        print(f"Processing node: name={node_name}, namespace={namespace}, id={node_id}")  # Debug print
        
        if node_id not in unique_nodes:
            unique_nodes.add(node_id)
            nodes.append({
                "name": node_name,
                "namespace": namespace
            })
    
    print("Final unique nodes:", nodes)  # Debug print
    return nodes


@app.get("/nodes/{node_name}")
def get_node_info(node_name: str):
    try:
        # Get node namespace from the node name
        node_names = introspection_node.get_node_names()
        # Find the node by matching the name part (after the last slash)
        node_info = next((name for name in node_names if name.split('/')[-1] == node_name), None)
        if not node_info:
            return {"error": f"Node {node_name} not found"}
        
        namespace = '/'.join(node_info.split('/')[:-1]) or '/'
        
        # Get publishers, subscribers, services, and clients with their types
        pubs = introspection_node.get_publisher_names_and_types_by_node(node_name, namespace)
        subs = introspection_node.get_subscriber_names_and_types_by_node(node_name, namespace)
        srvs = introspection_node.get_service_names_and_types_by_node(node_name, namespace)
        clts = introspection_node.get_client_names_and_types_by_node(node_name, namespace)

        return {
            "node": node_name,
            "namespace": namespace,
            "publishes": [{"topic": t, "types": types} for t, types in pubs],
            "subscribes": [{"topic": t, "types": types} for t, types in subs],
            "services": [{"service": s, "types": types} for s, types in srvs],
            "clients": [{"service": c, "types": types} for c, types in clts],
        }
    except Exception as e:
        return {"error": str(e)}
