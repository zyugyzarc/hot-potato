
//const TICK = 600 // 600ms -> 100BPM
const TICK = 1000 // 1000ms -> 60BPM

class App extends Component{

	constructor(dom){

		super( dom,{
			style: `
				body{
					margin: 0;
					padding: 0;
					width: 100%;
					height: 100%;
					background-color: black;
					overflow: hidden;
					color: #fff;
					font-family: sans-serif;
				}
				this{
					width: 100vw;
					aspect-ratio: 16 / 9;
					margin-top: max(0px, calc(0.5 * (100vh - 100vw * 9/16)) );
				}
				this .wrapper{
					display: flex;
					height: min(100%, 100vh);
					aspect-ratio: 16 / 9;
					background-color: #fff1;
					margin-left: max(0px, calc(0.5 * (100vw - 100vh * 16/9)) );

					padding: 1.5px;
				}

				this #popup{
					display: none;
				}

				this .board{
					--tick: "0";
					width: calc(50% - 2px);
					border: 4px solid black;
					border-radius: 10px;
					margin: 1.5px;
					display: flex;
				}
				this .scorecard{
					display: flex;
					width: 10%;
					height: calc(10% * 8/9);
					justify-content: center;
					align-items: center;
					margin: 4px;
					border: 4px solid black;
					border-radius: 10px;
					opacity: 0.5;
					user-select: none;
					font-size: 2.5rem;
				}
				this .region{
					width: 90%;
					height: calc(100% - 11px);
					border: 4px dashed #0f0;
					border-radius: 10px;
					margin: 1.5px;
				}
				this .red{
					background-color: #f001;
					border-color: #f00;
				}
				this .blue{
					background-color: #08f1;
					border-color: #08f;
				}
				this .board.red{
					flex-direction: row-reverse;
				}

				.board::before{
					content: var(--tick);
					background-color: #fff0;
					position: absolute;
					width: var(--pwidth);
					height: var(--pheight);
					pointer-events: none;
					transition-duration: 0.5s;
					color: #fff5;
					font-size: 15rem;

					display: flex;
					align-items: center;
					justify-content: center;
				}

				this .board.flash::before{
					transition-duration: 0.000001s;
					background-color: #fff2;
					color: #fff8;
				}

				.hand {
					--rot: 0;
					position: absolute;
					width: 40px;
					height: 40px;
					background-image: url('assets/hand.png');
					background-size: 100% 100%;
					z-index: 1;
					transform: translate(-50%, -50%) rotate(calc(var(--rot) - 90deg));
					pointer-events: none;
				}

				.hand.held{
					background-image: url('assets/hold.png');
				}

				.blue > .hand{
					filter: hue-rotate(225deg);
				}

				#potato{
					--rotation: 0deg;
					width: 50px;
					height: 50px;
					background-size: 50px 50px;
					background-image: url('assets/potato.png');
					background-color: #f0f0;
					border-radius: 25%;
					position: absolute;
					transform: translate(-50%, -50%) rotate(var(--rotation));
					pointer-events: none;
				}

				#explosion{
					position: absolute;
					width: 100px;
					height: 100px;
					transform: translate(-50%, -50%);
					background: url('assets/explosion.gif');
				}
			`,
			HTML: `
				<div class=wrapper>
					<div class="board blue"> <div class="region blue"></div><p class="scorecard blue">0</p></div>
					<div class="board red"> <div class="region red"></div><p class="scorecard red">0</p></div>
					<div id=potato></div>
					<div id=explosion style="display:none"></div>
				</div>
			`
		})

		this.network = new Popup(document.querySelector('#popup'), this)

		this.ticker = new Audio('assets/tick.mp3');
		this.explosion = new Audio('assets/explosion.mp3');

		this.ticker.preservesPitch = false

		// preload the image
		let i = new Image();
		i.src = 'assets/explosion.gif'

		//this.pulseAnim('red')


		// debugging 
		///*
		
		this.network.elem('#username').value = 'test'
		this.network.elem('#roomid').value = 'offline'
		this.network.connect()
		
		//*/

	}

	onready(){
		this.team = this.network.gamestate[this.network.playerid].team
		let team = this.team

		let el = document.createElement('div')
		el.classList.add('hand')
		el.id = this.network.playerid

		this.elem(`.${team}.region`).appendChild(el)
		//this.elem(`.wrapper`).appendChild(el)

		this.elem(`.${team}.region`).style.cursor = 'none'
		this.elem(`.${team}.region`).onmousemove = e=>{this.network.updateCurrentPlayer(e)}

		document.body.onmousedown = e=>{this.network.setString()}
		document.body.onmouseup   = e=>{this.network.releaseTato()}

	}

	pulseAnim(t, tick){

		tick = tick?tick:0;

		document.querySelector(`.board.red`).style.setProperty('--pwidth',  document.querySelector(`.board.red`).getBoundingClientRect().width  + 'px')
		document.querySelector(`.board.red`).style.setProperty('--pheight', document.querySelector(`.board.red`).getBoundingClientRect().height + 'px')

		document.querySelector(`.board.blue`).style.setProperty('--pwidth',  document.querySelector(`.board.blue`).getBoundingClientRect().width  + 'px')
		document.querySelector(`.board.blue`).style.setProperty('--pheight', document.querySelector(`.board.blue`).getBoundingClientRect().height + 'px')
		
		let e = document.querySelector(`.board.${t?t:this.network.gamestate.potato.region}`)

		e.style.setProperty('--tick', `"${(3 - tick)}"`);

		let [...l] = document.querySelectorAll('.board')
		l[1 - l.indexOf(e)].style.setProperty('--tick', `""`);
		
		e.classList.add('flash')
		setTimeout(()=>{e.classList.remove('flash')}, 100)
	}	

	tick(t){
		this.pulseAnim(false, t)
		this.ticker.playbackRate = (t > 0) ? 0.75 : 1
		this.ticker.play()
	}

	kaboom(coords){
		this.pulseAnim()
		
		let r = this.elem('.wrapper').getBoundingClientRect()

		let o = [r.left, r.top]
		let s = [r.right - r.left, r.bottom - r.top]

		this.elem('#explosion').style.display = 'block'
		this.elem('#explosion').style.top  = (coords[1]/100 * s[1] + o[1]) + 'px'
		this.elem('#explosion').style.left = (coords[0]/100 * s[0] + o[0]) + 'px'
		this.elem('#explosion').style.background += ''

		this.explosion.play()

		this.elem('.scorecard.red').innerHTML = this.network.gamestate.potato.score_red
		this.elem('.scorecard.blue').innerHTML = this.network.gamestate.potato.score_blue

		let e = this.elem('#explosion')
		setTimeout(()=>{
			e.style.display = 'none'
		}, 1.6* 1000)
	}

}

const now = () => {
	return (performance.now() + performance.timeOrigin)
}

class Popup extends Component{

	constructor(dom, parent){

		super(dom, {
			style: `
				this *{
					transition-duration: 0.01s;
				}
				this{
					position: absolute;
					width: 100%;
					height: 100%;
					top: 0;
					left: 0;

					backdrop-filter: blur(5px);

					display: flex;
					justify-content: center;
					align-items: center;
					text-align: center;
				}
				this .panel-inner{
					padding: 30px;
					border-radius: 15px;
					background-color: #222;
				}
				this input, this button{
					background-color: #333;
					font-weight: bold;
					font-family: monospace;
					color: #fff;
					padding: 3px;
					border: 3px solid #555;
					border-radius: 5px;
					margin-bottom: 3px;
				}

				this .panel-inner div{
					text-align: center;
				}
				this .panel-inner *{
					display: inline-block;
					vertical-align: middle;
				}
			`,
			HTML: `
				<div class=panel-inner>
					<div>
						<img src='assets/potato.png' width=75px><h1>Hot Potato</h1>
					</div><br><br>
					Username: <input id=username><br>
					Roomid: <input id=roomid><br>
					<button onclick="this.connect()">Join</button>
					<br> <p dynamic>{{this.state.players_list}}</p> <br>
					<button onclick="this.onteamchoose()" style="display:none" class=team-btn>Switch Team</button><br>
					<button class=start-connect-btn onclick="this.startcycle()" style="display:none">Connect</button>
					<button class=start-btn onclick="this.start(true)" style="display:none">Start Game</button><br>
				</div>
			`
		})

		this.state.teamchosen = ""
		this.state.players_list = ""
		this.parent = parent
		this.started = false
		this.turns = 0
		this.ticked = false
	}

	onteamchoose(){
		this.state.teamchosen = this.state.teamchosen.includes('Blue') ? '<span style="color:red">Red</span>' : '<span style="color:#08f">Blue</span>'

		if(this.gamestate){
			this.gamestate[this.playerid].team = this.state.teamchosen.includes('Blue') ? 'blue': 'red'
		}
	}

	onconnect(){

		console.log("connected!")
		console.log(this.gamestate)

		if(this.gamestate === undefined){

			console.log("init gamestate")
			
			this.gamestate = {}
			this.gamestate[this.playerid] = {team: this.state.teamchosen.includes('Blue')? 'blue' : 'red'}

			// let other people join
			console.log(this.node.initiator)
			if(this.node.initiator){
				console.log("Hosting for others")
				this.node.connectRoom(this.elem('#roomid').value, true)
			}
		}
		// the topology is a long double linked-list
		/*
			
			The most-recent offerer that is part of the network answers any external offers.

			A offers    |  A*
			B connects  |  B→A
			C offers    |  B-A*       C
			A connects  |  B-A←C*  
			D offers    |  B-A-C*     D
			C connects  |  B-A-C←D  
			E offers    |  B-A-C-D*   E
			D connects  |  B-A-C-D←E

			Wire protocol: bus

			when recv, pass along the packet, reflecting along the ends.
			Packet traversal example (starting A):
				A→C→D→E →D→C→A→B →A [...]

			To receive updates from all nodes: O(n)
			nodes towards the ends have more asymmetric round-trip times.
		*/
	}

	startcycle(){

		// start the packet rotation cycle

		this.lastping = now()

		this.node.sendTo(this.node.peers[0], { type: 'stateupdate', author:
		this.playerid, gamestate: this.gamestate, t: now() })

		console.log('stateupdate start to ' + this.node.peers[0])

		this.elem('.start-connect-btn').style.display = 'none'
		this.elem('.start-btn').style.display = 'block'
		this.elem('.team-btn').style.display = 'inline-block'

	}

	onevent(data){

		/*if(!this.started){
			if(data.type==='debug'){
				this.state.log += data.message + '<br>'
			}
		}*/

		if(!this.connected){
			this.connected = true
			this.elem('.start-connect-btn').style.display = 'none'
		}

		if(data.type === 'stateupdate'){

			//console.log('stateupdate!')

			let state = data.gamestate

			if('potato' in state){

				if(this.started === false){
					this.start(false)
				}


				if(this.gamestate.potato 
					&& this.gamestate.potato.controller === this.playerid 
					&& this.gamestate.potato.dectime >= state.potato.dectime){

					state.potato = this.gamestate.potato
				}

			}else{

				if(!this.started){

					let s = "Players: <br><br>"

					for(const [player, data] of Object.entries(state)){

						s += `<span style="color:${data.team}">${player}</span><br>`

					}

					this.state.players_list = s
				}
				else{
					state.potato = this.gamestate.potato
				}
			}

			state[this.playerid] = this.gamestate[this.playerid]

			this.gamestate = state

			// forward the state

			let target = ''

			if(this.node.peers.length == 1){
				target = this.node.peers[0]
			}else{
				for(const n of this.node.peers){
					if(n != data.author){

						target = n;
						break;

					}
				}
			}

			//console.log('passing to ' + target)
			//console.log('RTT-link ' + now() - data.t + ' ms')

			let delay = 0

			if(this.lastping){
				delay = now() - this.lastping;
				this.lastping = now()
				delay = 5 - delay; // 16 ms ideal ping
				delay = Math.max(0, delay)
			}

			
			//setTimeout(()=>{
				let t = window.components[1]
				t.node.sendTo(target, {
					type: 'stateupdate',
					author: t.playerid,
					gamestate: t.gamestate,
					t: now()
				})
			//}, delay)

			//if('potato' in this.gamestate){
			//	this.drawScene()
			//}

		}

	}

	connect(){

		let t = this

		this.playerid = this.elem('#username').value

		this.node = new Node(this.playerid)

		if(this.elem('#roomid').value != 'offline'){

			this.node.connectRoom(this.elem('#roomid').value, false)
		}

		this.node.onready = ()=>{t.onconnect()}
		this.node.onevent = data=>{ t.onevent(data) }

		this.elem('.start-connect-btn').style.display = 'block'

		if(this.elem('#roomid').value == 'offline'){
			this.gamestate = {}
			this.gamestate[this.playerid] = {team: 'blue'}
			this.start(true)
		}
	}

	start(starter){

		this.dom.style.display = 'none'
		this.started = true

		if(starter){

			console.log('starting')

			this.gamestate.potato = {
				y: 50, x: this.gamestate[this.playerid] == 'blue'? 25 : 75,
				vx:0, vy:0,
				t: 0,
				dectime: 0, region: this.gamestate[this.playerid].team,
				countdown: now(),
				score_red: 0, score_blue: 0, turns: 0,
				boom: [0, 0]
			}
		}
		
		this.parent.onready()
		let t = this
		setInterval(()=>{t.drawScene()}, 8)
	}

	drawScene(){

		if(!('potato' in this.gamestate)){
			return;
		}

		if(this.turns < this.gamestate.potato.turns){
			this.turns += 1

			this.parent.kaboom(this.gamestate.potato.boom)

		}

		let x = now() - this.gamestate.potato.countdown

		if((x%TICK) < 10){
			if(!this.ticked){
				let t = (x/TICK) | 0 // to int
				this.ticked = true
				if(t < 3){
					this.parent.tick(t)
				}
			}
		}else{
			this.ticked = false
		}

		let state = this.gamestate

		let r = this.parent.elem('.wrapper').getBoundingClientRect()

		let o = [r.left, r.top]
		let s = [r.right - r.left, r.bottom - r.top]

		this.parent.elem('#potato').style.top = state.potato.y/100 * s[1] + o[1]
		this.parent.elem('#potato').style.left = state.potato.x/100 * s[0] + o[0]
		this.parent.elem('#potato').style.setProperty("--rotation", state.potato.t + 'deg')

		for(const [player, data] of Object.entries(state)){
			if( player != 'potato'){

				if(!this.parent.elem(`#${player}`)){

					// add player to the board
					let el = document.createElement('div')
					el.classList.add('hand')
					el.id = player
					this.parent.elem(`.${data.team}.region`).appendChild(el)
				}

				// move the playerhand

				let p = this.parent.elem(`#${player}`);

				p.style.top  = data.y/100 * s[1] + o[1];
				p.style.left = data.x/100 * s[0] + o[0];

				const maxStringRad = 5;
				const distance = ((this.gamestate.potato.x - this.gamestate[this.playerid].x) ** 2 
								+ (9/16) * (this.gamestate.potato.y - this.gamestate[this.playerid].y) ** 2) ** 0.5

				if(distance >= maxStringRad){
					p.style.setProperty('--rot', 
						Math.atan2( data.y - this.gamestate.potato.y, data.x - this.gamestate.potato.x ) + 'rad'
					)
				}

				if(data.held){	p.classList.add('held')		}
				else{			p.classList.remove('held')  }


			}
		}

		if(this.gamestate.potato.controller === this.playerid){
			this.updatePotato(8)
		}

	}

	updateCurrentPlayer(ev){

		let r = this.parent.elem('.wrapper').getBoundingClientRect()

		let o = [r.left, r.top]
		let s = [r.right - r.left, r.bottom - r.top]

		if(!(this.playerid in this.gamestate)){
			this.gamestate[this.playerid] = {}
		}

		this.gamestate[this.playerid].x = (ev.clientX - o[0])/s[0] * 100
		this.gamestate[this.playerid].y = (ev.clientY - o[1])/s[1] * 100
	}

	updatePotato(dt){

		if((now() - this.gamestate.potato.countdown) > 3*TICK){ // explode at 3 ticks

			let r = this.gamestate.potato.region == 'blue' ? 'red' : 'blue'

			this.gamestate.potato['score_'+r]  += 1
			this.gamestate.potato.turns += 1

			this.gamestate.potato.countdown = now()
			
			this.gamestate.potato.boom = [this.gamestate.potato.x, this.gamestate.potato.y]
			this.gamestate.potato.y = 50
			this.gamestate.potato.x = this.gamestate.potato.region == 'blue' ? 75 : 25 
			this.gamestate.potato.vx  = Math.min(Math.max(this.gamestate.potato.vx, -0.05), 0.05)
			this.gamestate.potato.vy  = Math.min(Math.max(this.gamestate.potato.vy, -0.05), 0.05)
			
			this.gamestate.potato.control_mutex = false
			this.gamestate[this.gamestate.potato.controller].held = false

		}

		if(this.gamestate[this.playerid].held){

			let dx = this.gamestate.potato.x - this.gamestate[this.playerid].x;
			let dy = this.gamestate.potato.y - this.gamestate[this.playerid].y;

			let distance = (dx**2 + dy**2)**0.5;

			dx = dx/distance;
			dy = dy/distance;

			//let force = distance; //(distance - this.strlen);

			let force = 0

			if(distance > this.strlen * 2){
				//force = 0.01 * Math.log(distance);
				force = 0.001 * distance;
			}else{
				this.gamestate.potato.vx *= 0.8;
				this.gamestate.potato.vy *= 0.8;
			}

			let ax = force * dx *-1;
			let ay = force * dy *-1;

			this.gamestate.potato.vx += ax * dt;
			this.gamestate.potato.vy += ay * dt;

		}

		// decay
		this.gamestate.potato.vx *= 0.99;
		this.gamestate.potato.vy *= 0.99;

		// update pos
		this.gamestate.potato.x += this.gamestate.potato.vx * dt;
		this.gamestate.potato.y += this.gamestate.potato.vy * dt;
		this.gamestate.potato.t += Math.max(this.gamestate.potato.vx, this.gamestate.potato.vy) * 10 * dt;

		if(this.gamestate.potato.y < 0 || this.gamestate.potato.y > 100){
			this.gamestate.potato.vy *= -1;
		}

		if(this.gamestate.potato.x < 0 || this.gamestate.potato.x > 100){
			this.gamestate.potato.vx *= -1;
		}

		if(this.gamestate.potato.x < 50 && this.gamestate.potato.region == 'red'){
			this.gamestate.potato.region = 'blue'
			this.gamestate.potato.countdown = now()
			console.log('switch')
		}
		else if(this.gamestate.potato.x >= 50 && this.gamestate.potato.region == 'blue'){
			this.gamestate.potato.region = 'red'
			this.gamestate.potato.countdown = now()
			console.log('switch')
		}

		if(
			   (this.gamestate.potato.x > 45 && this.gamestate[this.playerid].team == 'blue')
			|| (this.gamestate.potato.x < 55 && this.gamestate[this.playerid].team == 'red')
		){
			this.releaseTato()
		}



		//console.log(`${this.gamestate.potato.x} ${this.gamestate.potato.y} ${this.gamestate[this.playerid].held} ${this.gamestate[this.playerid].x}`)

	}

	setString(){

		const maxStringRad = 5;

		const distance = ((this.gamestate.potato.x - this.gamestate[this.playerid].x) ** 2 
								+ (9/16) * (this.gamestate.potato.y - this.gamestate[this.playerid].y) ** 2) ** 0.5

		if(distance < maxStringRad && !this.gamestate.potato.control_mutex){

			this.gamestate.potato.controller = this.playerid
			this.gamestate.potato.control_mutex = true
			this.gamestate.potato.dectime = now()
			this.gamestate[this.playerid].held = true
			this.strlen = distance
		}

	}

	releaseTato(){
		this.gamestate.potato.control_mutex = false
		this.gamestate[this.playerid].held = false
	}

}