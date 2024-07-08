


// function stolen from stackoverflow: https://stackoverflow.com/a/8809472
function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// global array-map of components, based on their IDs
window.components = {length: 0}

class Component{

	/**
	 *  Represents a Component. A component is a localized collection of
	 *  HTML, CSS and JS, packaged together as a class, which can be instanciated.
	 */

	constructor(dom, layout, name){

		if(dom.attributes.component == undefined){
			dom.setAttribute("compontent", "!!Defined in JS")
		}

		this._state = {}
		this.cssvars_classes = []
		this.cssvars = {}
		this.componentID = 'component-'+generateUUID()
		this.name = name

		dom.id = this.componentID

		window.components[this.componentID] = this
		window.components[window.components.length] = this
		window.components.length++

		let component = this

		this.stateMutator = {

			component: component,

			set(obj, prop, value){

				let ret = Reflect.set(...arguments)
				this.component.update() // the state changed
				return ret
			}
		}

		this.state = new Proxy(this._state, this.stateMutator)

		this.layout = layout
		this.dom = dom

		dom.innerHTML = layout.HTML

		dom.querySelectorAll('*').forEach(e=>{

			for(const prop of e.attributes){

				// handle new components

				e.setAttribute("childOf", this.componentID)

				if(prop.name === 'component'){
					let fun = new Function(`return new ${prop.value}(...arguments)`)
					let args = e.attributes.args.value ? JSON.parse(e.attributes.args.value) : []
					args.unshift(e)
					fun.call(undefined, ...args)
					continue
				}

				// handle dynamic values

				if(prop.name === 'dynamic'){
					e.setAttribute('dynamic', e.innerHTML)
				}

				// handle eventlisteners

				const funcRegex = /this\..*?\(.*?\)/g

				if(prop.value.match(funcRegex) && prop.name.match(/on.*/)){
					
					e[prop.name] = e[prop.name].bind(this)
				}
			}
		})

		const style = document.createElement('style');
		let css = layout.style
			css = css.replace(/<.*?>/g, (f, o, s)=>component.setCssJsCallback(f, o, s))
			css = css.replace(/{{this\.state\.(.*?)}}/g, "var(--$1)")
			css = css.replace(/{{this\.cssvars\.(.*?)}}/g, "var(--$1)")
			css = css.replace(/this/g, '#'+this.componentID);
		    css = css.replace(/#[a-z0-9]*?\.(state|cssvars)\./g, '')

	    style.textContent = css
	    document.head.append(style);
	}

	setCssJsCallback(strfn, startpos, css){

		console.log(arguments)

		strfn = strfn.substring(1, strfn.length - 1)

		let classname = 'class-' + strfn.replace(/[^a-zA-Z]/g, '-') + '-' + generateUUID()
			classname = classname.replace(/this/g, 't')

		let callback = (new Function("return " + strfn)).bind(this)

		let selector = css.lastIndexOf('\n', startpos)
		selector = selector>0?selector:0;

		selector = css.substring(selector, startpos)
		selector = selector.replace(/this/g, `#${this.componentID}`)

		this.cssvars_classes.push({
			classname: classname,
			selector: selector,
			callback: callback
		})

		return "." + classname
	}

	elem(q){
		return this.dom.querySelector(q);
	}

	update(){

		// handle all the dynamic elements

		this.dom.querySelectorAll(`[childof=${this.componentID}][dynamic]`).forEach(e=>{

			if(e != this.dom && e.attributes.component){
				// dont do anything here, its another component
			}

			else{

				// too lazy to make a template engine, also sanitize your inputs
				let template = e.attributes.dynamic.value
					template = template.replace(/{{(.*?)}}/g, "\${$1}")

				let templated = new Function("return `" + template + "`").call(this)
				e.innerHTML = templated
			}

		})


		// handle all the dynamic styles

		for(let entry of this.cssvars_classes){

			console.log(entry)

			if(entry.callback()){
				this.dom.querySelectorAll(entry.selector).forEach(e=>{
					e.classList.add(entry.classname)
				})
			}else{
				this.dom.querySelectorAll(entry.selector).forEach(e=>{
					e.classList.remove(entry.classname)
				})
			}

		}

		// handle the cssvars

		/*

		let s = "";
		for(const prop in this.state){
			s += `--${prop}: ${this.state[prop]};\n`
		}

		for(const prop in this.cssvars){
			s += `--${prop}: ${this.cssvars[prop](this.state)};\n`
		}

		this.dom.style = s

		*/

		if(this.onupdate){
			this.onupdate()
		}

	}

}


function componentsInit(){

	document.querySelectorAll('*').forEach(e=>{
		
		if(e.attributes.component){				
			let fun = new Function(`return new ${e.attributes.component.value}(...arguments)`)
			let args = e.attributes.args.value ? JSON.parse(e.attributes.args.value) : []
			args.unshift(e)
			fun.call(undefined, ...args)
		}
	})
}