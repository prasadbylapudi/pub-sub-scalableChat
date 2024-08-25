import WebSocket, { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 5000 });

import { subscribeClient,publishClient } from './RedisManager';

//let's say what if we want to have kind of a chat room.
//we can use the concept of pub/sub.

//people might interested in more than one room.
/*
! this is how we can add a user to the subscriptions
*subscriptions["user123"] = {
*    ws: new WebSocket("ws://example.com"),
*   rooms: ["room1", "room2"]
};
*/
const subscriptions :{[key:string]:{ws:WebSocket,rooms:string[]}} = { };

    // setInterval(()=>{
    //     console.log(subscriptions)
    // },5000)

function generateId(){
  return Math.random().toString(36);
}

wss.on('connection', function connection(userSocket) {
    console.log("connected")
    const id=generateId()
    subscriptions[id]={
        ws:userSocket,
        rooms:[]
    }
    userSocket.on('message', function message(data) {
    const userMessage = JSON.parse(data as unknown as string);
        console.log('message',userMessage)
        if(userMessage.type==="SUBSCRIBE"){
            console.log("inside subscribe")
                subscriptions[id].rooms.push(userMessage.room) 
                //if it's first user then subscribe to the room.
                //@ts-ignore
                if(oneUserSubscribedTo(userMessage.room)){
                console.log("subscribing on the pub sub to room "+userMessage.room)

                subscribeClient.subscribe(userMessage.room,(message)=>{
                    const userMessage = JSON.parse(message);
                    Object.keys(subscriptions).forEach((userId)=>{
                        const {ws,rooms}=subscriptions[userId]
                        if(rooms.includes(userMessage.roomId)){
                            ws.send(userMessage.message)
                        }
                    })
                })
                
            }
                
        };
        if(userMessage.type==="UNSUBSCRIBE"){
            console.log("unsubscribing from the pub sub to room "+userMessage.room)
            subscriptions[id].rooms=subscriptions[id].rooms.filter(room=>room!==userMessage.room)
            //@ts-ignore
            if(lastPersonLeftRoom(userMessage.room)){
                console.log("unsubscribing from the pub sub to room "+userMessage.room)
                subscribeClient.unsubscribe(userMessage.room)
            }

        }

        if(userMessage.type==="sendMessage"){
            const message = userMessage.message
            const roomId= userMessage.roomId
            publishClient.publish(roomId,JSON.stringify({
                type:"sendMessage",
                roomId:roomId,
                message
            })) 
        }
})
})

function oneUserSubscribedTo(roomId:string){
    let totalInterestedPeople=0;
    console.log("checking if one user is subscribed to room "+roomId)
    
    Object.keys(subscriptions).map(userId=>{
        if(subscriptions[userId].rooms.includes(roomId)){
            totalInterestedPeople++;
            console.log("totalInterestedPeople",totalInterestedPeople)
        }
    
    })
     if(totalInterestedPeople==1){
           return true;
       }    
       return false;
}


function lastPersonLeftRoom(roomId:string){
    let totalInterestedPeople=0;
    console.log("checking if last user left room "+roomId)
    Object.keys(subscriptions).map(userId=>{
        if(subscriptions[userId].rooms.includes(roomId)){
            totalInterestedPeople++;
        }
    })
     if(totalInterestedPeople==0){
           return true;
       }    
       return false;   
}

