import React, { Component } from "react";

/* Add note module */
import { API, graphqlOperation } from "aws-amplify";

/* Import create note mutation file */
import { createNote, updateNote, deleteNote } from "./graphql/mutations";

/* Query */
import { listNotes } from "./graphql/queries";
import { withAuthenticator } from "aws-amplify-react";

/* Subscription */
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from "./graphql/subscriptions";

class App extends Component {
  state = {
    note: "",
    notes: [],
  };

  async componentDidMount() {
    this.getNotes();
    this.createNoteListerner = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          (note) => note.id !== newNote.id
        );
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes });
      },
    });

    this.updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: (noteData) => {
        const { notes } = this.state;
        const newNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex((note) => note.id === newNote.id);
        const updatedNotes = [
          ...notes.slice(0, index),
          newNote,
          ...notes.slice(index + 1),
        ];
        this.setState({ notes: updatedNotes, note: "", id: "" });
      },
    });

    this.deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: (noteData) => {
        const { notes } = this.state;
        const newNote = noteData.value.data.onDeleteNote;
        const newNotes = notes.filter((note) => note.id !== newNote.id);
        this.setState({ notes: newNotes });
      },
    });
  }

  componentWillUnmount() {
    this.createNoteListerner.unsubscribe();
    this.updateNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };
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
    const { id, note } = this.state;
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
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
      await API.graphql(graphqlOperation(createNote, { input }));

      this.setState({ note: "" });
    }
  };

  handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
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
