const token=''
const chatId=''

import axios from 'axios'
import { Bot } from 'grammy' ; const bot = new Bot(token)
import { XMLParser } from 'fast-xml-parser' ; const parser = new XMLParser();
import { EventEmitter } from 'events' ; const event = new EventEmitter()
import fns from 'date-fns' ; const { format, getTime, parseISO } = fns
import { decode } from 'html-entities'
import { schedule } from 'node-cron'

schedule('0 * * * * *'       , function() { console.log( format( Date.now(), "yyyy-MM-dd HH:mm:ss" ) ) } )

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

event.on('wait', async () => {
  await new Promise(resolve => setTimeout(resolve, 60000))
  event.emit('xml')
} )

event.on('xml', () => {
axios.post(url, xmls, {headers: {'Content-Type': 'text/xml'} })
  .then( res => {
  let obj = parser.parse(res.data)['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:GetCurrentlyPlayingResponse']['Result']
  console.log( '\n', obj, '\n' )
  event.emit( 'tm', obj ) })
  .catch( err => { console.log(err) ; event.emit('wait') } )
})

event.on('tm', async ( { Album, Track, Artist, Length, PlayStart, SystemTime, CoverLink } ) => {
  SystemTime = parseISO( SystemTime ) ; PlayStart = parseISO( PlayStart )
  let waitingTime = getTime( PlayStart ) + Length - getTime( SystemTime )
  console.log('PlayStart   :', PlayStart, ' : ', getTime(PlayStart))
  console.log('SystemTime  :', SystemTime, ' : ', getTime(SystemTime))
  console.log('Lenght      :', format(Length, 'mm:ss'), ' : ', Length )
  console.log('WaitingTime :', format( waitingTime, 'mm:ss' ), ' : ', waitingTime )
  if (waitingTime<0) {waitingTime=15000 ; console.log('WaitingTime :', format( waitingTime, 'mm:ss' ), ' : ', waitingTime ) }

  let Cover=CoverLink.replace('cover','cover/500')

  let NewAlbum
  let OldAlbum = decode(Album)
  NewAlbum = OldAlbum.toString().replace(', The','')
  if (OldAlbum == NewAlbum) { NewAlbum = OldAlbum.toString().replace(', A','')
    if (OldAlbum == NewAlbum) { Album = OldAlbum } else {Album = 'A ' + NewAlbum }
  } else {Album = 'The ' + NewAlbum}

  console.log()
  console.log( OldAlbum, ' == ', NewAlbum, ' => ', Album )
  console.log()

  let caption= `<b>${Album}</b>\n<i>${decode(Artist)}</i>\n${decode(Track)} [${format(Length, 'm:ss')}]`
  if (await axios( Cover ).then( () => true ).catch( () => false ) && Album !== 'StationID') {
    console.log(Cover)
    await bot.api.sendPhoto( chatId, Cover, { caption, parse_mode:'html'} ).catch( err => console.log( err ) )
  }

  await new Promise(resolve => setTimeout(resolve, waitingTime))
  event.emit('xml')

})

event.emit('xml')
