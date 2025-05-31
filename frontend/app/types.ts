export type Topic = {
  name: string;
  types: string[];
  encoded_name: string;
};

export type TopicInfo = {
  topic: string;
  encoded_topic: string;
  publishers: {
    node_name: string;
    node_namespace: string;
    topic_type: string;
  }[];
  subscribers: {
    node_name: string;
    node_namespace: string;
    topic_type: string;
  }[];
}; 