import React, { Component } from "react";

/* Add note module */
import { API, graphqlOperation } from "aws-amplify";

/* Import create note mutation file */
import { createNote } from "./graphql/mutations";

import { withAuthenticator } from "aws-amplify-react";

class App extends Component {
  state = {
    note: "",
    notes: [],
  };
  handleChangeNote = (event) => {
    this.setState({ note: event.target.value });
  };

  handleAddNote = (event) => {
    event.preventDefault();
    const { note } = this.state;
    const input = {
      note,
    };
    API.graphql(graphqlOperation(createNote, { input }));
  };

  render() {
    const { notes } = this.state;
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Amplify Notetaker</h1>
        {/* Note Form */}
        <form className="mb3" onSubmit={this.handleAddNote}>
          <input
            type="text"
            className="pa2 f4"
            placeholder="write your note"
            onChange={this.handleChangeNote}
          />
          <button className="pa2 f4" type="submit">
            Add Note
          </button>
        </form>
        {/* Notes List */}
        <div>
          {notes.map((item) => (
            <div key={item.key} className="flex items-center">
              <li className="list pa1 f3">{item.note}</li>
              <button className="bg-transparent bn f4">
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
