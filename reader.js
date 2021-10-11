var colors = require("colors")
var fs = require("fs")
function say(...text){console.log(text.join(" "))}
const clear = console.clear
var skip = false
var jumpTo = 0
async function readOut(text, hooks){
	if(text.match(/^:/)){ //Read a file
		text = fs.readFileSync(text.replace(":","")).toString().trim()
	}

	var lineReg = /(?:(#?[0-9]+)(-[0-9]*)?>([^\\]+))|(\$[0-9]+)|(@[0-9]+)/
	var gLineReg = new RegExp(lineReg.source, "g")
	var lines = text.match(gLineReg)
	lines.pop()

	//Lines are gotten.

	var writeBuffer = ""
	for(var i = 0;i<lines.length;i++){
		if(jumpTo > 0){
			var lns = 0
			var mat = text.match(new RegExp(`@${jumpTo}`))
			if(!mat)throw "Invalid position: "+jumpTo
			var cln = lines[lns]
			while(!cln.match(new RegExp(`^@${jumpTo}`))){
				lns++
				cln = lines[lns]
			}
			i = lns
			jumpTo = 0
		}
		var ln = lines[i]
		var m = ln.match(lineReg)
		if(m[4]){ //If this is a hook
			var n = Number(m[4].replace("$",""))-1
			var l = getLogContext(writeBuffer)
			await hooks[n](l)
			writeBuffer = l.flush()
			continue
		}
		if(m[5]){ //If this is a jump point.
			continue
		}
		await sleep(Number(m[1])) //Normal delay
		if(m[3].match("\\?<")){ //Clear it out
			clear()
			writeBuffer = ""
		}else if(!m[2]){//Just log it
			writeBuffer += m[3]
			writeBuffer += "\n"
			say(m[3])
		}else{//Delay log
			writeBuffer += "\n"
			var time = 35
			var skipChars = 0
			if(m[2].slice(1)){
				time = parseInt(m[2].slice(1))
			}
			m[3] = m[3].replace(/>-'(.*)'/g, `*125;<15>'$1'<${time}>`)
			var color = colors.white
			for(var c = 0;c<m[3].length;c++){
				if(skip){
					skip = false
					time = 0
					m[3] = m[3].replace(/(\*[0-9]+;)|<[0-9]+>/g,"")
					break
				}
				if(m[3][c] == "<"){
					var num = ""
					var i2 = c+1
					skipChars++
					while(m[3][i2] != ">"){
						num += m[3][i2]
						skipChars++
						i2++
					}
					skipChars++
					time = Number(num)
				}
				if(m[3][c] == "*"){
					var num = ""
					var i2 = c+1
					skipChars++
					while(m[3][i2] != ";"){
						num += m[3][i2]
						skipChars++
						i2++
					}
					skipChars++
					await sleep(Number(num))
				}
				if(m[3][c] == "["){
					var col = ""
					var i2 = c+1
					skipChars++
					while(m[3][i2] != "]"){
						col += m[3][i2]
						skipChars++
						i2++
					}
					skipChars++
					color = colors[col]
				}
				if(skipChars > 0){
					skipChars--
					continue
				}
				await sleep(time)
				clear()
				writeBuffer += color(m[3][c])
				say(writeBuffer)
			}
		}
	}
}
function sleep(time){
	return new Promise(r=>{setTimeout(r,time)})
}
module.exports = {
	read:readOut,
	getLogContext:getLogContext
}
function getLogContext(buffer){
	var l = (...text)=>{
		console.log(text.join(" "))
		buffer += text.join(" ")
		buffer += "\n"
	}
	l.buf = (text)=>{buffer += ("\n"+text)}
	l.skip = ()=>{skip = true}
	l.jump = (marker)=>{
		jumpTo = marker
	}
	l.clear = ()=>{
		buffer = ""
		clear()
	}
	l.flushed = false
	l.flush = ()=>{
		l = console.log
		l.buf = (text)=>{}
		l.skip = ()=>{}
		l.flush = ()=>{}
		l.jump = ()=>{}
		l.clear = clear
		l.flushed = true
		return buffer
	}
	return l
}
