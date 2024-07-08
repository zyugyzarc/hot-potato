

function uuid() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

class Node{
	
	constructor(nodeid){

		this.id = nodeid
		this.room = null

		this.peers = []
		this.pcs = {};
		this.connecting = null
	}

	/*
		Override `this.onevent(message)` and `this.onready()`
		Available Methods:
			this.connectRoom(roomid, [only-answer])
			this.sendTo(recv-id, message)
			this.broadcast(message)
	*/

	async connectRoom(roomid, acceptonly){
		this.room = roomid

		// check if someone is already waiting to connect
		let resp = await fetch(`${sconf.host}/get/${roomid}-offer`, {
			headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`}
		})

		resp = await resp.json()

		if((resp.result && resp.result !== 'invalid') || acceptonly){

			while(!(resp.result && resp.result !== 'invalid')){
					console.log('waiting for offer (passive)')
					await sleep(5000)

					resp = await fetch(`${sconf.host}/get/${roomid}-offer`, {
						headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`}
					})

					resp = await resp.json()
			}

			// someone's already waiting

			let answer = await this.answer(resp.result) // resp.result is an offer

			// respond to the offer

			console.log(`${this.id}: sending answer`)

			resp = await fetch(`${sconf.host}/set/${roomid}-answer`, {
				headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`},
				body: answer,
				method: 'POST'
			})

			// delete the initial offer

			resp = await fetch(`${sconf.host}/set/${roomid}-offer`, {
				headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`},
				body: 'invalid',
				method: 'POST'
			})

			// we're done

		}
		else{
			// start the connection

			this.initiator = true; // for rings and chains, later

			let offer = await this.offer() // create offer

			// send the offer

			console.log(`${this.id}: sending offer (initiator)`)

			// unset any previous answers

			resp = await fetch(`${sconf.host}/set/${roomid}-answer`, {
				headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`},
				body: 'invalid',
				method: 'POST'
			})

			resp = await fetch(`${sconf.host}/set/${roomid}-offer`, {
				headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`},
				body: offer,
				method: 'POST'
			})

			// keep pinging for the answer

			while(true){

				console.log(`${this.id}: waiting for answer`)

				resp = await fetch(`${sconf.host}/get/${roomid}-answer`, {
					headers: {'Accept': 'application/json', Authorization: `Bearer ${sconf.token}`}
				})

				resp = await resp.json()

				if(resp.result && resp.result !== 'invalid'){
					break;
				}
				await sleep(acceptonly?10000:1000)
			}

			// got an answer (in `resp.result`)
			console.log(`${this.id}: got answer`)

			await this.accept(resp.result)
		}



	}

	async offer(){
		
		if(this.connecting){
			console.error("offer attempted when already in connectingstate")
		}

		this.connecting = new RTCPeerConnection()

		let t = this
		let channel = this.connecting.createDataChannel('data')
		channel.onopen = () => {t.initiate(channel)}

		let ices = []
		this.connecting.onicecandidate = ev => {
			ices.push(ev.candidate)
		}

		let offer = await this.connecting.createOffer()
		this.connecting.setLocalDescription(offer)

		await sleep(100)

		offer.ices = ices

		return JSON.stringify(offer)
	}

	async answer(offer){

		if(typeof offer === 'string'){
			offer = JSON.parse(offer)
		}

		if(this.connecting){
			console.error("offer attempted when already in connectingstate")
		}

		this.connecting = new RTCPeerConnection()

		let t = this
		this.connecting.ondatachannel = ev => {
			t.initiate(ev.channel)
		}

		let ices = []
		this.connecting.onicecandidate = ev => {
			ices.push(ev.candidate)
		}

		this.connecting.setRemoteDescription(offer)

		for(const c of offer.ices){
			this.connecting.addIceCandidate(c)
		}

		let answer = await this.connecting.createAnswer()
		this.connecting.setLocalDescription(answer)

		await new Promise(r => setTimeout(r, 100));

		answer.ices = ices

		return JSON.stringify(answer)

	}

	async accept(answer){

		answer = JSON.parse(answer)

		if(!this.connecting){
			console.error("accept attempted when not in connectingstate")
		}

		this.connecting.setRemoteDescription(answer)

		for(const c of answer.ices){
			this.connecting.addIceCandidate(c)
		}

	}

	initiate(ch){

		console.log(`${this.id}: connection ready`)
		
		let t = this
		
		ch.onmessage = ev => t.initiatereply(ch, ev.data)

		ch.onclose = ev => {
			// discard the connection
			ch.close()
			this.connecting.close()
			this.connecting = null
		}

		ch.send(JSON.stringify(this.initiatemessage()))
	}

	initiatemessage(){
		return {
			type: "introduce",
			author: this.id
		}
	}

	initiatereply(ch, message){

		let t = this
		let data = JSON.parse(message)
		
		this.pcs[data.author] = {
			channel: ch,
			connection: this.connecting
		}

		this.connecting = null
		ch.onmessage = ev => {t.oneventmessage(ev.data)}

		this.peers.push(data.author)
		this.onready()
	}

	oneventmessage(data){
		data = JSON.parse(data)

		if(data.broadcast){
			this.broadcast(data)
		}

		this.onevent(data)
	}

	broadcast(data){

		if(!data.seen){
			data.seen = []
		}
		data.seen.push(this.id)

		for(const [p, _] of Object.entries(this.pcs)){
			if(data.seen.includes(p)){
				continue;
			}
			this.sendTo(p, data)
		}
	}

	sendTo(recv, data){
		data = JSON.stringify(data)
		this.pcs[recv].channel.send(data)
	}
}
