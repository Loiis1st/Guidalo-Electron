const mysql = require('mysql');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const connection = mysql.createConnection({
      host: 'mysql-guidalo.alwaysdata.net',
      user: 'guidalo',
      password: 'Dglsio974@480',
      database: 'guidalo_dbguidalo'
    });

const app = express();
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// Chargement page d'accueil
app.get('/', function(request, response) {
	if (request.session.loggedin) {
		// Render accueil template
		response.sendFile(path.join(__dirname + '/views/index.html'));
	}else {
		// Render login template
		response.sendFile(path.join(__dirname + '/views/login.html'));
	}
	
});

app.get('/profil', function(request, response) {
	if (request.session.loggedin){
		// Render profil template
		response.sendFile(path.join(__dirname + '/views/profil.html'));
	}else {
		// Render login template
		response.sendFile(path.join(__dirname + '/views/login.html'));
	}
	
});

app.get('/personnel', function(request, response) {
	if (request.session.loggedin){
		// Render personnel template
		response.sendFile(path.join(__dirname + '/views/personnel.html'));
	}else {
		// Render login template
		response.sendFile(path.join(__dirname + '/views/login.html'));
	}
	
});

app.get('/etudiant', function(request, response) {
	if (request.session.loggedin){
		// Render personnel template
		response.sendFile(path.join(__dirname + '/views/etudiant.html'));
	}else {
		// Render login template
		response.sendFile(path.join(__dirname + '/views/login.html'));
	}
	
});

app.get('/deconnexion', function(request, response) {
	request.session.loggedin = false;
	request.session.username = false;
	request.session.idEtu = false;
	response.redirect('/');
});

app.post('/inscription', function(request, response) {
	
	// On r??cup??re les informations du formulaire d'inscription
	let nom = request.body.nom;
	let prenom = request.body.prenom;
	let username = request.body.username;
	let password = request.body.password;
	let repassword = request.body.repassword;

	// on v??rifie que les mots de passe sont identiques
	if(repassword!=password) {
		response.send('Mots de passe non identiques ! <br/><br/> <a href="/">Retourner ?? la page de connexion</a>');
	}

	// cr??e d'abord l'??tudiant

	// requete avec variable ?? remplacer pour cr??er l'??tudiant
	let stmtEtudiant  = 'INSERT INTO `etudiant`(`NomEtu`, `PrenomEtu`, `lienPhotoProfil`) VALUES (?, ?, ?) ';
	// Tableau des variables dans l'ordre d'apparution
	let variablesEtudiant = [nom, prenom, 'http://ssl.gstatic.com/accounts/ui/avatar_2x.png'];
	// Ex??cution de la requete de cr??ation d'??tudiant
	connection.query(stmtEtudiant, variablesEtudiant, (err, results, fields) => {
	  if (err) {
	    return console.error(err.message);
	  }
	  // On r??cup??re l'id de l'??tudiant pour le mettre dans la table utisateur
	  //console.log('Etudiant Id:' + results.insertId);
	  let idEtudiant = results.insertId;

		// On cr??e ensuite l'utilisateur

		// On encrypte le mot de passe
		var crypto = require('crypto');
		var hash = crypto.createHash('sha256');
		hash.update(password, 'utf-8');
		encryptedPassword = hash.digest("hex");

		// requete avec variable ?? remplacer pour cr??er l'utisateur
		let stmtUtilisateur  = 'INSERT INTO `utilisateur`(`username`, `password`, `type`, `idEtu`) VALUES (?, ?, ?, ?) ';
		// Tableau des variables dans l'ordre d'apparution
		let variablesUtilisateur = [username, encryptedPassword, 0, idEtudiant];
	  	
		// Ex??cution de la requete de cr??ation d'??tudiant
		connection.query(stmtUtilisateur, variablesUtilisateur, (err, results, fields) => {
			if (err) {
			    return console.error(err.message);
			  }
	  		//console.log('Utilisateur Id:' + results.insertId);
	  		response.send('Votre compte a bien ??t?? cr????, <a href="/">cliquez ici</a> pour vous connecter.');
	  });

	});

});

app.post('/connexion', function(request, response) {
	var crypto = require('crypto');
	var hash = crypto.createHash('sha256');
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;

	// Ensure the input fields exists and are not empty
	if (username && password) {
		hash.update(password, 'utf-8');
		encryptedPassword = hash.digest("hex");
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM utilisateur WHERE username = ? AND password = ?', [username, encryptedPassword], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				request.session.idEtu = results[0].idEtu;

				//options de cookie
				let options = {
			        maxAge: 1000 * 60 * 60 * 24 //dur??e cookie
			    }
			    // Utilisation du cookie, pour r??cup??rer l'id Etudiant sur la page profil
				response.cookie('idEtu', results[0].idEtu, options)

				// Redirect to home page
				response.redirect('/');
			} else {
				response.send('Utilisateur/Mot de passe incorrect ! <br/><br/> <a href="/">Retourner ?? la page de connexion</a>');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

let server = app.listen(3000);
