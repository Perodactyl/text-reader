var fs = require("fs")
function say(...text){console.log(text.join(" "))}
const clear = console.clear
async function readOut(text, hooks){
	if(text.match(/^:/)){
		text = fs.readFileSync(text.replace(":","")).toString().trim()
	}
	var lineReg = /(?:(#?[0-9]+)(-[0-9]*)?>([^\\]+))|(\$[0-9]+)/
	var gLineReg = new RegExp(lineReg.source, "g")
	var lines = text.match(gLineReg)
	lines.pop()
	var writeBuffer = ""
	for(var i = 0;i<lines.length;i++){
		var ln = lines[i]
		var m = ln.match(lineReg)
		if(m[4]){
			var n = Number(m[4].replace("$",""))-1
			await hooks[n]()
			continue
		}
		await sleep(Number(m[1]))
		if(m[3].match("\\?<")){
			clear()
			writeBuffer = ""
		}else if(!m[2]){
			writeBuffer += m[3]
			writeBuffer += "\n"
			say(m[3])
		}else{
			writeBuffer += "\n"
			var time = 35
			var skipChars = 0
			if(m[2].slice(1)){
				time = parseInt(m[2].slice(1))
			}
			m[3] = m[3].replace(/>-'(.*)'/g, `*125;<15>'$1'<${time}>`)
			for(var c = 0;c<m[3].length;c++){
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
				if(skipChars > 0){
					skipChars--
					continue
				}
				await sleep(time)
				clear()
				writeBuffer += m[3][c]
				say(writeBuffer)
			}
		}
	}
}
function sleep(time){
	return new Promise(r=>{setTimeout(r,time)})
}
module.exports = {
	read:readOut
}
function event(obj,on){
	return new Promise((r)=>{
		obj.on(on, r)
	})
}
