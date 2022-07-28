'use strict';

var express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./javascript/AppUtil.js');

var app = express();

var path = require('path');
var fs = require('fs');

// static /public -> ./public
app.use('/', express.static(path.join(__dirname,'public')));

// body-parser app.use
app.use(express.urlencoded({ extended : false}));
app.use(express.json());

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');


app.post('/user', async(req, res) => {
    var name = req.body.name;
    var department = req.body.department;

    console.log("/user start -- ", name, department);

    try {
        const wallet = await buildWallet(Wallets, walletPath);
		//await enrollAdmin(caClient, wallet, mspOrg1); // wallet/admin.id
		await registerAndEnrollUser(caClient, wallet, mspOrg1, name, department); // wallet/${name}.id
    } catch (error) {
        var result = `{"result":"fail", "id":"${name}", "affiliation":"${department}"}`;
        var obj = JSON.parse(result);
        console.log("/user end -- failed");
        res.status(200).send(obj);
        //선생님이 생각해내셨습니다.
        return;
    }

    var result = `{"result":"success", "id":"${name}", "affiliation":"${department}"}`;
    var obj = JSON.parse(result);
    console.log("/user end -- success");
    res.status(200).send(obj);

});

app.post('/admin', async(req, res) => {

    console.log("/admin start -- ");

    try {
        const wallet = await buildWallet(Wallets, walletPath);
		await enrollAdmin(caClient, wallet, mspOrg1); // wallet/admin.id
    } catch (error) {
        var result = `{"result":"fail", "id":"admin"}`;
        var obj = JSON.parse(result);
        console.log("/admin end -- failed");
        res.status(200).send(obj);
        return;
    }

    var result = `{"result":"success", "id":"admin"}`;
    var obj = JSON.parse(result);
    console.log("/admin end -- success");
    res.status(200).send(obj);

});

app.get('/user/list', async(req, res) => {

    console.log("/user/list start -- ");

    let wlist;
    try {
        const wallet = await buildWallet(Wallets, walletPath);
        wlist = await wallet.list();

    } catch (error) {
        var result = `{"result":"fail", "id":{"/user/list"}}`;
        var obj = JSON.parse(result);
        console.log("/user/list end -- failed");
        res.status(200).send(obj);
        return;
    }

    var result = `{"result":"success", "id":"${wlist}"}`;
    var obj = JSON.parse(result);
    console.log("/user/list end -- success");
    res.status(200).send(obj);

});

app.post('/artwork', async(req, res) =>{
    var name = req.body.name;
    var artist = req.body.artist;
    var price = req.body.price;
    var owner = req.body.owner;

    console.log("/artwork post start -- ", name, artist, price, owner);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);
		// GW -> connect -> CH -> CC -> submitTransaction

        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("artwork");
        await contract.submitTransaction('IssueArtwork',name, artist, price, owner);

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/artwork end -- failed ", error);
        res.status(200).send(obj);
        return;
    }finally {
         gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/artwork end -- success");
    res.status(200).send(obj);
});

app.get('/artwork', async(req, res) =>{
    var name = req.query.name;
    //var userkey = req.query.userkey;
    console.log("/artwork get start -- ", name);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);
		// GW -> connect -> CH -> CC -> submitTransaction
        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed 
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("artwork");
        var result = await contract.evaluateTransaction('ReadArtwork',name);
        // result 가 byte array라고 생각하고
        var result = `{"result":"success", "message":${result}}`;
        console.log("/artwork get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"ReadArtwork has a error"}`;
        var obj = JSON.parse(result);
        console.log("/artwork get end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

app.post('/artwork/tx', async(req, res) =>{
    var name = req.body.name;
    var artist = req.body.artist;
    var owner = req.body.owner;

    console.log("/artwork/tx post start -- ", name, artist, owner);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);
		// GW -> connect -> CH -> CC -> submitTransaction
        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("artwork");
        await contract.submitTransaction('TransferArtwork',name, artist, owner);

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/artwork/tx end -- failed ", error);
        res.status(200).send(obj);
        return;
    }finally {
         gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/artwork/tx end -- success");
    res.status(200).send(obj);
});

app.get('/artwork/history', async(req, res) =>{
    var name = req.query.name;
    var artist = req.query.artist;
    //var userkey = req.query.userkey;
    console.log("/artist get start -- ", name, artist);
    const gateway = new Gateway();
    try {
        const wallet = await buildWallet(Wallets, walletPath);
		// GW -> connect -> CH -> CC -> submitTransaction
        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed 
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("artwork");
        var result = await contract.evaluateTransaction('GetHistoryForArtwork',name, artist);
        // result 가 byte array라고 생각하고
        var result = `{"result":"success", "message":${result}}`;
        console.log("/artwork/history get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"GetHistoryForArtwork has a error"}`;
        var obj = JSON.parse(result);
        console.log("/artwork/history get end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

app.get('/', (req,res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// server listen
app.listen(3000, () => {
    console.log('Express server is started: 3000');
});