import mqtt from "mqtt";

const mqttUrl = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQTT_URL || "ws://broker.emqx.io:8083/mqtt";
// Cache the connection
const client = mqtt.connect(mqttUrl, { rejectUnauthorized: false });

client.on('error', (err) => {
    console.error('MQTT backend error:', err);
});

export async function broadcastSessionUpdate(sessionId: string, data?: any) {
  try {
     const message = (data && data.type) ? data : { type: 'SESSION_UPDATE', payload: data };
     client.publish(`session/${sessionId}`, JSON.stringify(message));
  } catch(e) {
      console.error("Socket emit error:", e);
  }
}
