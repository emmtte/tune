#sudo apt install recode libxml2-utils
clear

while :
do
echo
sst=$(curl -X POST http://www.streamingsoundtracks.com/soap/FM24seven.php \
  -H 'Content-Type: text/xml' \
  -d '<?xml version="1.0" encoding="ISO-8859-1" standalone="no" ?>
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
</SOAP-ENV:Envelope>
')

echo "$sst"

# A Ajouter lors d'une erreur
#f [ "${sst}"== "error" ]; then  fi;
#Album=$(echo "$sst" | xmllint --xpath "//Album/text()" - | recode xml..UTF-8 | recode html..UTF-8)
Album=$(echo "$sst" | xmllint --xpath "//Album/text()" - | recode html..UTF-8)
Track=$(echo "$sst" | xmllint --xpath "//Track/text()" - | recode html..UTF-8)
Artist=$(echo "$sst" | xmllint --xpath "//Artist/text()" - | recode html..UTF-8)
Asin=$(echo "$sst" | xmllint --xpath "///CoverLink/text()" - | rev | cut -d'/' -f 1 | rev)
CoverLink="http://www.streamingsoundtracks.com/images/cover/500/$Asin"
SiteLink="http://www.streamingsoundtracks.com/modules.php?name=Album&asin=$Asin"
PlayStart=$(echo "$sst" | xmllint --xpath "///PlayStart/text()" -)
SystemTime=$(echo "$sst" | xmllint --xpath "///SystemTime/text()" -)
Length=$(echo "$sst" | xmllint --xpath "///Length/text()" -)
ListenerCount=$(echo "$sst" | xmllint --xpath "///ListenerCount/text()" -)
RequestedBy=$(echo "$sst" | xmllint --xpath "///RequestedBy/text()" -)
#xmlstarlet unesc
echo $Album
Album=$(echo "$Album" | sed -e 's/&/%26/g')
echo $Album

echo $Artist
Artist=$(echo "$Artist" | sed -e 's/&/%26/g')
echo $Artist

echo $Track
Track=$(echo "$Track" | sed -e 's/&/%26/g')
echo $Track

echo $Asin
echo $CoverLink
echo $SiteLink
echo $PlayStart
echo $SystemTime
echo $Length
echo $ListenerCount
echo $RequestedBy
Length=$(($Length / 1000))
echo $Length
Time=$(date -d @$Length +"%-M:%S")
echo $Time

caption=$(echo "<b>$Album</b>%0A<i>$Artist</i>%0A$Track  [$Time]")
echo "$caption"

curl -X POST https://api.telegram.org/bot$TELEGRAM_TOKEN/sendPhoto \
     -H "Content-Type: application/x-www-form-urlencoded; charset=utf-8" \
     -d chat_id=$TELEGRAM_CHATID \
     -d photo="$CoverLink" \
     -d caption="$caption" \
     -d parse_mode="html"

echo
echo $(date)
echo "SST system time $SystemTime"
Start=$(date -d "$PlayStart" "+%s")
Now=$(date -d "$SystemTime" "+%s")
End=$((Start + Length))
Secs=$((End - Now))
echo
echo "wait $Secs seconds"
sleep $Secs

done
