var express = require('express') // Popular web framework for Node.js
var bodyParser = require('body-parser') // Auto parses body of post and put requests
var morgan = require('morgan') // Logs HTTP requests to the console
var sqlite3 = require('sqlite3').verbose(); // SQLite client for Node.js
var app = express()
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
app.use(express.static('static'));    // makes the files in /static folder available
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());                        
app.use(morgan('dev'));                            

let db = new sqlite3.Database('./repo.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.log("Getting error " + err);
    exit(1);
  }
});
var port = process.argv[2] || 8888;
// HTTP SERVER
app.listen(port, function () {
  console.log('app listening on port ' + port + '!')
});

// HOME PAGE
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/index.html');
});

// API ENDPOINTS

app.get('/api/test/pubkeys', function (request, response) {
	response.json(testData);
  });
  
app.get('/api/test/pubkeys/:name', function (request, response) {
	var user = request.params.name;
	console.log(request.params)
	response.json(getTestDataByUser(user))
  })

  app.post('/api/pubkeys', function (request, response) {
    const { user, publicKey } = request.body;
  
    if (!user || !publicKey) {
      return response.status(400).json({ error: "Username and PublicKey are required" });
    }
  
    const sql = `INSERT INTO PublicKeyRepository (Username, PublicKey) VALUES (?, ?)`;
    db.run(sql, [user, publicKey], function (err) {
      if (err) {
        if (err.code === "SQLITE_CONSTRAINT") {
    
          return response.status(409).json({ error: "Username already exists" });
        } else {
          return response.status(500).json({ error: "Database error" });
        }
      }
      response.status(201).json({ message: "Public key registered successfully" });
    });
  });
  

  app.get('/api/pubkeys', function (request, response) {
    const sql = `SELECT Username, PublicKey FROM PublicKeyRepository`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        return response.status(500).json({ error: "Database error" });
      }
      response.json(rows);
    });
  });
  
  app.get('/api/pubkeys/:name', function (request, response) {
    const name = request.params.name;
    const sql = `SELECT PublicKey FROM PublicKeyRepository WHERE Username = ?`;
  
    db.get(sql, [name], (err, row) => {
      if (err) {
        return response.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return response.status(404).json({ error: "User not found" });
      }
      response.json(row);
    });
  });

  app.delete('/api/pubkeys/:name', function (request, response) {
    const name = request.params.name;
    const sql = `DELETE FROM PublicKeyRepository WHERE Username = ?`;
  
    db.run(sql, [name], function (err) {
      if (err) {
        return response.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return response.status(404).json({ error: "User not found" });
      }
      response.json({ message: "User deleted successfully" });
    });
  });


var testData = [{user:"kurt", pubkey:`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtlmGrGwKKSjUO7RwqZyuY+tt9
6YnwNvO6HCTq5+phNBwFXrAXiEzWDqtww1fauygNdiaIAHCkRHkwOdWNGHqYl4Yi
CbHtKvSeWOQFsWfb2HgW+briksXgW6Ru1cEoHi1DqzVk/H2/L0Zi+5LRqWpDrFWB
mUCUe7GYQ2RTXMk+IQIDAQAB
-----END PUBLIC KEY-----`}, {user:"laban", pubkey:`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCfbGowNlKFD/JRUspCHkdr/zP
T//Fcxs9zcBp38ns3qU+EXqyKX0e4JMQC7N3QZRPD5+gcyfe1ixTgpjQaICKIZM0
7q7OF2eH07JQ3TtnP0Mq5qVQEuyFjpIazcM8B+/Cham3js4KWAgTzeL3cbOpcsEO
F++BSGYFIRiKv+ZDoQIDAQAB
-----END PUBLIC KEY-----`}]

getTestDataByUser = function(username){
	for(i=0; i<testData.length; i++)
	{
	  if (testData[i].user==username)
	  {
		return testData[i];
	  }
	}
	return null;
  }