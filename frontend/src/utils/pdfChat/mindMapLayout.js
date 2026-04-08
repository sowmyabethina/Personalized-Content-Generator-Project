export const convertMindMapToFlowElements = (data) => {
  if (!data || !data.title) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  let nodeId = 0;
  const generateId = () => `node-${nodeId++}`;

  const nodeStyle = {
    background: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "10px 14px",
    color: "#1F2937",
    fontSize: "14px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
    width: 180,
    textAlign: "center",
  };

  const centerX = 600;
  const centerY = 350;
  const horizontalGap = 280;
  const verticalGap = 120;
  const childGap = 200;
  const rootId = "root";

  nodes.push({
    id: rootId,
    type: "input",
    position: { x: centerX, y: centerY },
    data: { label: data.title },
    style: {
      background: "#2563EB",
      color: "white",
      padding: "14px 20px",
      borderRadius: "16px",
      fontWeight: "700",
      fontSize: "18px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
      width: 200,
      textAlign: "center",
    },
  });

  const topics = data.children || [];
  const leftTopics = topics.filter((_, index) => index % 2 === 0);
  const rightTopics = topics.filter((_, index) => index % 2 === 1);

  const appendTopicBranch = (topic, index, side) => {
    const direction = side === "right" ? 1 : -1;
    const topicId = generateId();
    const yOffset = (index - (side === "right" ? rightTopics.length : leftTopics.length) / 2) * verticalGap;

    nodes.push({
      id: topicId,
      position: {
        x: centerX + (direction * horizontalGap),
        y: centerY + yOffset,
      },
      data: { label: topic.title },
      style: nodeStyle,
    });

    edges.push({
      id: `e-root-${topicId}`,
      source: rootId,
      target: topicId,
      type: "smoothstep",
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    });

    (topic.children || []).forEach((child, childIndex) => {
      const childId = generateId();

      nodes.push({
        id: childId,
        position: {
          x: centerX + (direction * (horizontalGap + childGap)),
          y: centerY + yOffset + (childIndex - topic.children.length / 2) * 80,
        },
        data: { label: child.title },
        style: nodeStyle,
      });

      edges.push({
        id: `e-${topicId}-${childId}`,
        source: topicId,
        target: childId,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });
    });
  };

  rightTopics.forEach((topic, index) => appendTopicBranch(topic, index, "right"));
  leftTopics.forEach((topic, index) => appendTopicBranch(topic, index, "left"));

  return { nodes, edges };
};

export default convertMindMapToFlowElements;
