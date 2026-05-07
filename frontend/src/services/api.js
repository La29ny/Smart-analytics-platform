//api.js


const BASE_URL = "http://127.0.0.1:5000";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
};

export const previewFile = async (filename, page = 1, limit = 100) => {
  const res = await fetch(
    `${BASE_URL}/preview?filename=${filename}&page=${page}&limit=${limit}`
  );
  return res.json();
};

export const trainModel = async (filename, target) => {
  const res = await fetch(`${BASE_URL}/train`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, target }),
  });

  return res.json();
};

export const predict = async (input) => {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  return res.json();
};