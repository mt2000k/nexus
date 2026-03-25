import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function createSocket(token) {
  return io(SERVER_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 30000,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: { token },
  });
}

export const EVENTS = {
  USER_JOIN: 'user_join',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ONLINE_USERS: 'online_users',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  GET_ROOMS: 'get_rooms',
  ROOM_CREATED: 'room_created',
  ROOMS_UPDATED: 'rooms_updated',
  GET_ROOM_MEMBERS: 'get_room_members',
  CREATE_DM: 'create_dm',
  DM_CREATED: 'dm_created',
  SHARE_ROOM_KEY: 'share_room_key',
  ROOM_KEY_SHARED: 'room_key_shared',
  CALL_USER: 'call_user',
  INCOMING_CALL: 'incoming_call',
  ACCEPT_CALL: 'accept_call',
  CALL_ACCEPTED: 'call_accepted',
  REJECT_CALL: 'reject_call',
  CALL_REJECTED: 'call_rejected',
  END_CALL: 'end_call',
  CALL_ENDED: 'call_ended',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice_candidate',
};
