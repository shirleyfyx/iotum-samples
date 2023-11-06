import React, { useState, useEffect, useRef } from 'react';
import CredentialsForm from '../../components/credentials-form';
import ChatRoomList from './ChatRoomList';
import styles from './submitForm.module.css';
import * as Callbridge from '@iotum/callbridge-js';

export const App = () => {
  const [token, setToken] = useState('');
  const [hostId, setHostId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [domain, setDomain] = useState('iotum.callbridge.rocks'); //default domain

  const widget = useRef(null);

  const handleTokenChange = (event) => {
    setToken(event.target.value);
  };
  
  
  const handleHostIdChange = (event) => {
    setHostId(event.target.value);
  };

  const handleDomainChange = (event) => {
    setDomain(event.target.value);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRoomButtonClick = (path) => {
    setAllRooms((prevRooms) => {
      return prevRooms.map((room) => {
        if (room.path === path) {
          return { ...room, bool: true}; // Toggle the boolean value
        }
        return room;
      });
    });
  };

  const handleRoomClose = (path) => {
    console.log(path + " was closed");
    setAllRooms((prevRooms) => {
      return prevRooms.map((room) => {
        if (room.path === path) {
          return { ...room, bool: false };
        }
        return room;
      });
    });
  };

  const renderWidget = () => {
    console.log("renderWidget ran");
    widget.current = new Callbridge.Dashboard(
      {
        domain: domain, // using the state variable for domain
        sso: {
          token: token,
          hostId: hostId
        },
        container: '#chat',
      },
      'Team',
      { layout: 'list', pathname: '/'}
    );
    console.log("dashboard rendered");

    widget.current.once('dashboard.ROOM_LIST', (data) => {
      const uniqueAccountNames = []; // To keep track of account names that should have "(you)" added
      const allRoomsChange = Object.values(data.rooms).map((room) => {
        const accounts = room.accounts.map((account) => account.name);
    
        // Check if the room has only one account
        if (accounts.length === 1) {
          const accountName = `${accounts[0]} (you)`;
          uniqueAccountNames.push(accounts[0]); // Add the account name to the unique list
          return {
            name: accountName,
            path: room.path,
            bool: false,
          };
        }
    
        // Filter out account names that are in the unique list
        const filteredNames = accounts.filter((name) => !uniqueAccountNames.includes(name));
        return {
          name: filteredNames.join(', '),
          path: room.path,
          bool: false,
        };
      });
    
      setAllRooms(allRoomsChange);
    });

    widget.current.on('dashboard.NAVIGATE', (data) => {
      if (data.pathname !== "/") {
        widget.current.load("Team", {layout: "list"})
        console.log("There was a navigate event to " + data.pathname + " in the list widget and the list widget was reloaded");
      } 

      handleRoomButtonClick(data.pathname);
      }
    )

    widget.current.on('dashboard.READY', () => {
      console.log("The list widget was rendered");
    });
  }

  useEffect(() => {
    if (submitted) {
      renderWidget();
    }
  }, [submitted]);

  console.log("pass 1");
  
  if (submitted) {
    return (
      <div className={styles.container}>
        <div id="chat" className={styles.roomListContainer}></div>

        <div>
          <ChatRoomList
            rooms={allRooms}
            onRoomClose={handleRoomClose}
          />
        </div>
      </div>
    );
  }

  return (
    <CredentialsForm
      title="Chat Room List App"
      domain={domain}
      token={token}
      hostId={hostId}
      onDomainChange={(event) => setDomain(event.target.value)}
      onTokenChange={(event) => setToken(event.target.value)}
      onHostIdChange={(event) => setHostId(event.target.value)}
      onSubmit={handleSubmit}
    />
  );
};

export default App;
