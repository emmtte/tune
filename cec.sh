#!/bin/bash

tvservice -M 2>&1 | while read LINE #run tvservice monitor
do
  if [[ "$LINE" == *attached* ]]; then
      
   tvservice -d /tmp/tvservice &>/dev/null
   if grep -q 'EP-HDMI-RX' /tmp/tvservice ; then TV=off ; fi
   if grep -q 'LG TV'      /tmp/tvservice ; then TV=on  ; fi
   if pgrep -x 'kodi' > /dev/null ; then KODI=on ; else KODI=off ; fi
   if pgrep -x 'cvlc' > /dev/null ; then  SST=on ; else  SST=off ; fi

   echo ; echo ; echo "$(date '+%d/%m/%Y %H:%M:%S') TV : $TV - KODI : $KODI - SST : $SST"

   if [ $TV == on ] && [ $KODI == off ] ; then 
     echo "START KODI"
     sudo killall mpv
     kodi 2>&1 &  
   fi
   
   if [ $TV == off ] && [ $KODI == on ] ; then
     echo "STOP KODI"
     kodi-send --action="Quit"
   fi

   if [ $TV == off ] && [ $KODI == off ] && [ $SST == off ]; then 
     echo "START SST"
     sudo killall mpv
     mpv http://hi5.streamingsoundtracks.com 2>&1 &
   fi
   
   if [ $TV == off ] && [ $KODI == off ] && [ $SST == on ]; then 
     echo "STOP SST"
     sudo killall mpv
   fi 
      
 fi
done
