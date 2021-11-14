const token=
const chatId=

import axios from 'axios'
import { Bot } from 'grammy' ; const bot = new Bot(token)
import parser from 'fast-xml-parser'
import { EventEmitter } from 'events' ; const event = new EventEmitter()
import fns from 'date-fns' ; const { add, addSeconds, addMinutes, parseISO, getUnixTime, format} = fns
import fns_tz from 'date-fns-tz' ; const { zonedTimeToUtc } = fns_tz
import schedule from 'node-schedule'
const globalTimeZone = 'America/New_York'
import {decode} from 'html-entities'
import urlExist from "url-exist"
let job

schedule.scheduleJob('0 * * * * *', function(){console.log(format(Date.now(),"yyyy-MM-dd HH:mm:ss"))});

bot.start()

const url = 'http://www.streamingsoundtracks.com/soap/FM24seven.php';
const xmls = `<?xml version="1.0" encoding="ISO-8859-1" standalone="no" ?>
<SOAP-ENV:Envelope
 SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
 xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
 xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
 xmlns:xsi="http://www.w3.org/1999/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/1999/XMLSchema">
 <SOAP-ENV:Body>
  <GetCurrentlyPlaying>
  </GetCurrentlyPlaying>
 </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`

event.on('xml', () => {
axios.post(url, xmls, {headers: {'Content-Type': 'text/xml'} })
  .then(res=>{
  let obj = parser.parse(res.data)['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:GetCurrentlyPlayingResponse']['Result']
  console.log(obj,'\n')
  event.emit('tm',obj) })
  .catch(err=>{
    console.log(err)
    job = schedule.scheduleJob(addMinutes(Date.now(),1), () => { job.cancel(); event.emit('xml')})
  })
})

event.on('tm', async (obj) => {
let now = zonedTimeToUtc(parseISO(obj.SystemTime),globalTimeZone)
let end = zonedTimeToUtc(add(parseISO(obj.PlayStart), { seconds: getUnixTime(obj.Length)+1}),globalTimeZone) //add 1s because of 100eme
let time  = addSeconds(new Date(0), getUnixTime(obj.Length)) ; let length = format(time, 'm:ss');
console.log('now:',now) ; console.log('end:',end)
let cover=obj.CoverLink.replace('cover','cover/500')

let album, newAlbum
let oldAlbum = decode(obj.Album)
newAlbum = oldAlbum.toString().replace(', The','')
if (oldAlbum == newAlbum){
  newAlbum = oldAlbum.toString().replace(', A','')
  if (oldAlbum == newAlbum) { album = oldAlbum 
  } else {album = 'A ' + newAlbum}
} else {album = 'The ' + newAlbum} 
 console.log(oldAlbum,'==',newAlbum,'=>',album)

let caption= `<b>${album}</b>\n<i>${decode(obj.Artist)}</i>\n${decode(obj.Track)} [${length}]`
if ((await urlExist(cover)) && (obj.Album !== 'StationID')) {bot.api.sendPhoto(chatId, cover, {caption:caption, parse_mode:'html'})}
job = schedule.scheduleJob(end, () => { job.cancel(); event.emit('xml')})
})

event.emit('xml')
