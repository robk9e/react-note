import React, { Component } from "react";

/* Add note module */
import { API, graphqlOperation } from "aws-amplify";

/* Import create note mutation file */
import { createNote, updateNote, deleteNote } from "./graphql/mutations";

/* Query */
import { listNotes } from "./graphql/queries";
import { withAuthenticator } from "aws-amplify-react";

class App extends Component {
  state = {
    note: "",
    notes: [],
  };

  async componentDidMount() {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  }
  handleChangeNote = (event) => {
    this.setState({ note: event.target.value });
  };

  hasExistingNote = () => {
    const { notes, id } = this.state;
    if (id) {
      // is the id a valid id?
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }

    return false;
  };

  handleUpdateNote = async (item) => {
    const { notes, id, note } = this.state;
    const input = { id, note };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    const index = notes.findIndex((note) => note.id === updatedNote.id);
    const updatedNotes = [
      ...notes.slice(0, index),
      updatedNote,
      ...notes.slice(index + 1),
    ];

    this.setState({ notes: updatedNotes, note: "", id: "" });
  };

  handleAddNote = async (event) => {
    event.preventDefault();
    const { note, notes } = this.state;
    // check if we have an existing notem, if so update it
    if (this.hasExistingNote()) {
      this.handleUpdateNote();
    } else {
      const input = {
        note,
      };
      const result = await API.graphql(graphqlOperation(createNote, { input }));

      const newNote = result.data.createNote;
      const updatedNotes = [newNote, ...notes];

      this.setState({ notes: updatedNotes, note: "" });
    }
  };

  handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deletedNoteId = result.data.deleteNote.id;

    const { notes } = this.state;

    const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);

    this.setState({ notes: updatedNotes });
  };

  handleSetNote = ({ note, id }) => {
    this.setState({ note, id });
  };

  render() {
    const { notes, note, id } = this.state;
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
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {id ? "Update" : "Add Note"}
          </button>
        </form>
        {/* Notes List */}
        <div>
          {notes.map((item) => (
            <div key={item.id} className="flex items-center">
              <li
                className="list pa1 f3"
                onClick={() => this.handleSetNote(item)}
              >
                {item.note}
              </li>
              <button
                className="bg-transparent bn f4"
                onClick={() => this.handleDeleteNote(item.id)}
              >
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
