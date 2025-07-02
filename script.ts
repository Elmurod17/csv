const form = document.getElementById("csvForm") as HTMLFormElement;
const csvInput = document.getElementById("csvInput") as HTMLTextAreaElement;
const csvFile = document.getElementById("csvFile") as HTMLInputElement;
const responseArea = document.getElementById("responseArea") as HTMLPreElement;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  if (csvFile.files && csvFile.files.length > 0) {
    formData.append("file", csvFile.files[0]);
  } else if (csvInput.value.trim() !== "") {
    formData.append("csv", csvInput.value.trim());
  } else {
    responseArea.textContent = "Please enter CSV data or upload a file.";
    return;
  }

  try {
    const res = await fetch("/csv", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      responseArea.textContent = JSON.stringify(result, null, 2);
    } else {
      responseArea.textContent = "Error: " + result.error;
    }
  } catch (err) {
    responseArea.textContent = "Error sending request.";
  }
});
