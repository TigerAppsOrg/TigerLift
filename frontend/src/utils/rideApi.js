// Ride actions shared by Home and Ride Details. Each resolves to the
// server's { success, message }, or a failure message if the request fails.

const postJson = async (url, body) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (error) {
    console.error(`Error posting to ${url}:`, error);
    return {
      success: false,
      message: "Something went wrong. Check your connection and try again.",
    };
  }
};

// "November 14, 2026, 4:30 PM" in Eastern time, for notification text
const formatArrivalForEmail = (arrivalTime) => {
  const date = new Date(arrivalTime);
  const options = { timeZone: "America/New_York" };
  const day = date.toLocaleDateString("en-US", {
    ...options,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    ...options,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
};

export const requestToJoin = (ride, note) =>
  postJson("/api/requestride", {
    rideid: ride.id,
    origin_name: ride.origin.name,
    destination_name: ride.destination.name,
    formatted_arrival_time: formatArrivalForEmail(ride.arrival_time),
    note: note,
  });

export const cancelRequest = (ride) =>
  postJson("/api/cancelriderequest", { rideid: ride.id });

// action: "accept" | "reject"
export const respondToRequest = (ride, requesterNetid, action) =>
  postJson("/api/respondtorequest", {
    rideid: ride.id,
    requester_id: requesterNetid,
    action: action,
  });
