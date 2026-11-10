const privateKey = "af6cb535-179f-4e20-a372-9fd3168dad44";
const assistantId = "edffc188-7ba5-426f-b1b1-66298243130a";

fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  headers: {
    Authorization: `Bearer ${privateKey}`
  }
})
.then(r => r.json())
.then(data => {
  console.log("Status:", data.id ? "OK" : "ERROR");
  console.log("ID:", data.id);
  console.log("Name:", data.name);
  console.log("Tools count:", (data.model?.tools || []).length);
  if (data.message) console.log("Message:", data.message);
})
.catch(e => console.error("Error:", e.message));
