import mqtt from "mqtt";

const mqttUrl = process.env.MQTT_URL || "mqtt://mqtt.fitlhu.com";
// Cache the connection
const client = mqtt.connect(mqttUrl);

client.on('error', (err) => {
    console.error('MQTT backend error:', err);
});

export async function broadcastSessionUpdate(sessionId: string, data?: any) {
  try {
     client.publish(`session/${sessionId}`, JSON.stringify({ type: 'UPDATE', payload: data }));
  } catch(e) {
      console.error("Socket emit error:", e);
  }
}
