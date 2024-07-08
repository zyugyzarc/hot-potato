 
# Hot Potato

Play now - [hot-potato.zyugyzarc.vercel.app](hot-potato.zyugyzarc.vercel.app)

Hot potato is a simple multiplayer peer-to-peer game made with javascript and an (optional, and low-intensity) backend database. This is built using a custom-made UI-framework (see []()), alongside a p2p setup built on WebRTC (see []()).

# How to play

After first loading the page, create a new username and put in the room-id (use a random string of letters and numbers if you dont have one). If you just made up a room-id, your friends must use the same room-id to join you.

Once a good number of people have joined, *one* person presses the connect button - which should let each player choose what team they're on. Once everyone is ready, press "start".

One team randomly begins with the potato. Throw the potato to the other side within 3 seconds, if not, the other team gets a point. The potato is thrown by dragging the potato across the screen, and letting go.

# About the Framework

For the UI-Framework this project uses, see [zyugyzarc/quizzerole](https://github.com/zyugyzarc/quizzerole).

TL;DR: Thsi project uses a JS UI-Framework I made previously (no dependecies), that is similar to React - but every "component" is a class/object instead of a factory function.

# About the Network

This project uses WebRTC to connect peers together, and has a dedicated peer-manager (see `rtc.js` above). P2P Discovery is done through a Redis KV Database on vercel.

For this project in particular, each node with fewer than 2 peers connects to a soon-to-be peer with no peers. This forms an open-ring, or linear network, through which a state-management "packet" is bounced back and forth throughout the network - this is done to ensure that only one peer at a time modifies the global state to prevent race conditions and traffic, at the expense of latency.
