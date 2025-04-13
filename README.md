# experiment626
galactic conquest game

Setting up tools: 
    1. set up Xcode or VSCode   x
    2. set up a GitHub account  x
    3. Add to github experiment626 repository  
    4. install github desktop (free)
    5. do the sample github make branch, check in , push to main process. 
    6. install VSCode
    7. integrate with github/ github co-pilot
    

Experiment626 setup

    1.  install home-brew https://brew.sh here 
    2.  there are some follow up steps that print to terminal that you actually have to run for brew to work! 
    3.  install node - and then test that node -v and npm -v commands work 
    4.  set up Colyseus- inside the project - 
        npm create colyseus-app@latest ./experitment626-server
        (I forgot that i had done this before) 
    4a.    also, npm install colyseus.js
        I am not sure if i should have done "create" or "install" above.. but i ran "create" for colyseus and install for the javascript/client side... 
        Anyway, i did this... and then i used .gitignore to hopefully ignore the installed files that are not really part of our source, and should be managed by NPM dependencies
    5.  set up free version of github co-pilot
    6.  do this colyseus examples install : https://github.com/colyseus/colyseus-examples by runnign the git command etc. 
    7. it looks to me like we should use something like the static.html pages to generate a test harness for seeing if our messages get through, and have the right data. And then, later, report the new state back so we can see if the state is evolving properly.
    8.  well, now i've added all the colyseus stuff to the GIT repository so now it isn't clear that we need to run install... we'll find out on holland's machine. It feels like this should have been done just with package managedment so i have mixed feelings aobut what i just did. 
    9.  Next steps - use Nova source to identify the "interfasces": 
        * definition of a star - properties and methods - Star.py
        * definition of a user - properties and methods  - player.py 
        * definition of a galaxy (map) - properties and methods
        * definition of a fleet (or ship) - properties and methods. I think all props / methods can be on a "fleet" of ships - a grouping of ships all with the same attributes. 
        * ?? anything else?
        * spyprobe is something kevin was introducing but which did not exist in the original. we probably don't need it initially. 
    10. there's a notion of production - and then spending it on - speed, range, factories, battle power. how often do production events happen? I recall they were once every n hours 
        production event produces both wealth and new factories, and then factories produce new ships. 
    11. lots of key game mechancis are in the /nova/engine folder - like "newGame" and mapLoader" and "engine"
    12. CreateSQL (in /nova/GeneratedSQL) - has the table structures which in a way is a shortcut to what properties we need on our objects - and in our in-memory databse 

    



Key ideas:
    •    logging history so that even if everything crashes it can be “reinflated” 
    •    logging history so that a user can “replay” what has happened from their perspective 
    •    logging history so that at the end the players can see a “replay” of how the whole game played out with omniscient knowledge… could be fun :) 
    •    in-memory database that does most of the work. Might not need a real database if history logging/recovery works…? 
    •    Colysues supports much more interactive/live action games… our game might be so retro that it is overkill… 
    •    We should think about how to build this so that Colyseus can be replaced in the future - always plan to own the whole stack eventually.  Reverse engineering could be interesting too. 
    •    The communications are synchronous (TCP) rather than UCP / unguaranteed.  So we should have reliable comms. But : our game should work without full information. A missed packet etc should be easy enough. Server has all the history anyway.  
    •    server owns “state”. Clients can submit “requests” to change state - like “launch fleet” for example.
    •    It doesn’t seem like we’d need any linear prediction, though possibly you could optimize the number of update a client asks for by having it know “how long until the next interesting event will happen” but it isn’t clear that that kind of optimization is important. 
    •    In our terminology, let's think about what Rooms are:
        * room type: Lobby - see what games you are participating in, join a new game, "quit" a game, etc. 
            - extra points if we implement a list of historical games that we can replay for you !
        * room type: Galaxy - this is basically a running instance of the game
            Properties:
            - number of stars (or parameters for generating them)
            - any particular rules of the galaxy: 
                * min/max players, 
                * paid/free game, 
                * units of time, game: time limit or unlimited?
                * conditions of winning? 
                * visibility rules, 
                * production rules, 
                * speed rules, 
                * costing etc. 
                * combat rules 
                * alliances / etc. rules if any (there was none of this in the original)
            - we'll want a chat room inside the galazy (i think)
        * room type: Chat only - all your chats from all your galaxies? 


