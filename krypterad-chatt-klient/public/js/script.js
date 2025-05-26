const ws = new WebSocket(`ws://${window.document.location.host}`);
const crypt = new JSEncrypt();
let privateKeyGlobal = "";

function createWebSocket() {
  ws = new WebSocket(`ws://${window.document.location.host}`);
}

function setPublicKey(key){
crypt.setPublicKey(key);
  console.log("Public key succesfully added")
}

function setPrivateKey(key){
crypt.setPrivateKey(key);
console.log("Private key succesfully added")  
}


function encryptMessage(message) {
  const encrypted = crypt.encrypt(message);
  if (!encrypted) {
    console.error("Encryption failed for message:", message);
  }
  return encrypted
}

function decryptMessage(encryptedMessage) {
  crypt.setPrivateKey(privateKeyGlobal);
  const decryptedMessage = crypt.decrypt(encryptedMessage);

  return decryptedMessage;
}


ws.onopen = function () {
  console.log("Websocket connection opened");
};
ws.onclose = function () {
  console.log("Websocket connection closed");
};

ws.onmessage = function (message) {
  const json = JSON.parse(message.data);
  console.log("Received message:", json);

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msgCtn");

  let displayedMessage = json.message;

ws.onmessage = function (message) {
  const json = JSON.parse(message.data);
  console.log("Received message:", json);

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msgCtn");

  let displayedMessage = json.message;

  if (json.encrypted == 'true') { 
        const decryptedMessage = decryptMessage(json.message);
        if (!decryptedMessage) {
            console.warn("Decryption failed for message:", json.message);
            displayedMessage = "<i>decrypted message</i>"; 
        } else {
            console.log("Decryption worked");
            displayedMessage = decryptedMessage; 
        }
  } else if (json.encrypted == 'false') {
    console.log("Message is not encrypted, skipping decryption.");
    displayedMessage = json.message; 
  }
    else {
    console.log("Message is not encrypted, skipping decryption.");
    displayedMessage = json.message; 
  }

  if (json.message.includes("has entered the chat")) {
    msgDiv.innerHTML = `<i>${displayedMessage}</i>`;
  } else {
    msgDiv.innerHTML = `${json.user}:  ${displayedMessage}`;
  }

  document.getElementById("messages").appendChild(msgDiv);
  chat_div.scrollTop = chat_div.scrollHeight;

  if (json.color) {
    msgDiv.style.backgroundColor = json.color;
  }
};

  if (json.message.includes("has entered the chat")) {
    msgDiv.innerHTML = `<i>${displayedMessage}</i>`; 
  } else {
    msgDiv.textContent = `${json.user}:  ${displayedMessage}`;

  }

  document.getElementById("messages").appendChild(msgDiv);
  chat_div.scrollTop = chat_div.scrollHeight;

  if (json.color) {
    msgDiv.style.backgroundColor = json.color;
  }
};


const user_div = document.getElementById("set_username");
const chat_div = document.getElementById("chat");
const userform = document.getElementById("userForm");
const msgform = document.getElementById("msgForm");
const select_element = document.getElementById("publicKeysSelect");
const search_user = document.getElementById("search_user");
const search_form = document.getElementById("searchForm");
const search_results_div = document.getElementById("searchResult");

async function fetchPublicKeys() {
  try {
      const response = await fetch('http://localhost:8888/api/pubkeys/');
      if (!response.ok) throw new Error('API not available');
      return await response.json();
  } catch (error) {
      alert('Could not fetch public keys: ' + error.message);
      return [];
  }
}

async function fetchPublicKeyByUsername(username) {
  try {
      const response = await fetch(`http://localhost:8888/api/pubkeys/${username}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('API not available');
      return await response.json();
  } catch (error) {
      alert('Could not fetch public key: ' + error.message);
      return null;
  }
}



async function displayPublicKeysInSelect() {
  const publicKeys = await fetchPublicKeys();
  const selectElement = document.getElementById('publicKeysSelect');

  publicKeys.forEach(key => {
      const option = document.createElement('option');
      option.value = key.PublicKey;
      option.textContent = `${key.Username}`;
      selectElement.appendChild(option);
  });
}

displayPublicKeysInSelect();

async function searchUser(username) {
  try {
    const result = await fetchPublicKeyByUsername(username);
    if (!result) {
      return { found: false, message: `No user found with username: ${username}` };
    }
    return { found: true, data: result };
  } catch (error) {
    return { found: false, message: `Error searching for user: ${error.message}` };
  }
}


searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("searchInputBox").value.trim();
  search_form.style.display = "flex";
  search_results_div.style.display = "flex";

  if (username === "") {
    search_results_div.textContent = "Please enter a username to search.";
    return;
  }

  const searchResult = await searchUser(username);
  

  if (searchResult.found) {
    search_results_div.textContent = `User found: ${username}`;
  } else {
    search_results_div.textContent = searchResult.message;
  }
});




userform.addEventListener('submit', (event) => {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    createWebSocket();
  }

  event.preventDefault();
  const username = userform.querySelector("#userinputBox").value;
  privateKeyGlobal = userform.querySelector("#userprivatekeyBox").value; 

  if (privateKeyGlobal === "") {
    alert("Private key are required to join the chat.");
    return;
   }
 
   setPrivateKey(privateKeyGlobal);


  let user = new Object();
  user.username = username;
  ws.send(JSON.stringify(user));
  user_div.style.display = "none";
  chat_div.style.display = "flex";
  select_element.style.display = "flex";
  search_user.style.display = "flex";
 
  user.color;
});

msgform.addEventListener("submit", async (event) => {
  event.preventDefault();

  const encryptCheckbox = document.getElementById("encryptCheckbox");
  const message = document.getElementById("messageinputBox").value.trim();
  const selectedKey = select_element.value;
  const searchResultText = search_results_div.textContent;
  let encrypted = false;

  if (message === "") {
    alert("You cannot send an empty message.");
    return;
  }

  let publicKey = null;

  if (encryptCheckbox.checked) {
    
    if (selectedKey) {
      publicKey = selectedKey; 
    } else if (searchResultText.startsWith("User found: ")) {
      const username = searchResultText.replace("User found: ", "").trim();
      const result = await fetchPublicKeyByUsername(username);

      if (result && result.PublicKey) {
        publicKey = result.PublicKey; 
      }
    }

    if (publicKey) {
      setPublicKey(publicKey); 

      const encryptedMessage = encryptMessage(message); 
      if (encryptedMessage) {
        let msg = { message: encryptedMessage, encrypted: true }
        ws.send(JSON.stringify(msg));
        console.log("Message sent (encrypted):", encryptedMessage);
        encrypted = true;
      } else {
        alert("Failed to encrypt the message. Sending unencrypted.");
      }
    } else {
      alert("You must select or search for a user to send encrypted messages.");
      return;
    }
  }

  if (!encrypted) {
    ws.send(JSON.stringify({ message, encrypted: false }));
    console.log("Message sent (unencrypted):", message);
  }

  document.getElementById("messageinputBox").value = "";
});


msgform.addEventListener("reset", (event) => {
  event.preventDefault(); 

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ message: "has left the chat." }));
    setTimeout(() => {
      ws.close();
      console.log("WebSocket connection closed by user.");
    }, 100);
  }
});

