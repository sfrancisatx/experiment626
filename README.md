# experiment626
galactic conquest game

Setting up tools: 
    1. set up Xcode or VSCode
    2. set up a GitHub account
    3. Add to github experiment626 repository
    4. install github desktop (free)
    5. do the sample github make branch, check in , push to main process. 
    

Experiment626 setup

    1.  install home-brew https://brew.sh here 
    2.  there are some follow up steps that print to terminal that you actually have to run for brew to work! 
    3.  install node - and then test that node -v and npm -v commands work 
    4.  set up Colyseus- inside the project - 
        npm create colyseus-app@latest ./my-server
        (I forgot that i had done this before) 
    4a.    also, npm install colyseus.js
        I am not sure if i should have done "create" or "install" above.. but i ran "create" for colyseus and install for the javascript/client side... 
    5.  set up free version of github co-pilot
    6.  do this colyseus examples install : https://github.com/colyseus/colyseus-examples by runnign the git command etc. 
    7. it looks to me like we should use something like the static.html pages to generate a test harness for seeing if our messages get through, and have the right data. And then, later, report the new state back so we can see if the state is evolving properly.
    



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
    •    

