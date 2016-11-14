import React from 'react';

import './app.css';

class App extends React.Component {

    render() {
        let mappedNotes = this.props.song.map((note, i) => {
            return (<div key={i} className="notecontainer">{note.signature}</div>)
        });

        return (
            <div className="songcontainer">
                {mappedNotes}
            </div>
        );
    }

}

export default App;
