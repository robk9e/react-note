import React, { Component, useState, useEffect } from "react";

/* Add note module */
import { API, graphqlOperation, Auth } from "aws-amplify";

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

const App = () => {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const owner = Auth.user.username;
    getNotes();
    // (await Auth.currentAuthenticatedUser()).username;
    const createNoteListerner = API.graphql(
      graphqlOperation(onCreateNote, {
        owner,
      })
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;

        setNotes((prevNotes) => {
          const oldNotes = prevNotes.filter((note) => note.id !== newNote.id);
          const updatedNotes = [...oldNotes, newNote];
          return updatedNotes;
        });
      },
    });

    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote, {
        owner,
      })
    ).subscribe({
      next: (noteData) => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setNotes((prevNotes) => {
          const index = prevNotes.findIndex(
            (note) => note.id === updatedNote.id
          );

          const updatedNotes = [
            ...prevNotes.slice(0, index),
            updatedNote,
            ...prevNotes.slice(index + 1),
          ];

          return updatedNotes;
        });

        setId("");
        setNote("");
      },
    });

    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote, {
        owner,
      })
    ).subscribe({
      next: (noteData) => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setNotes((prevNotes) => {
          const updatedNotes = prevNotes.filter(
            (note) => note.id !== deletedNote.id
          );
          return updatedNotes;
        });
      },
    });

    return () => {
      createNoteListerner.unsubscribe();
      updateNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
    };
  }, []);

  /* async componentDidMount() {
    
  }

  componentWillUnmount() {
   
  } */

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  const handleChangeNote = (event) => {
    setNote(event.target.value);
  };

  const hasExistingNote = () => {
    if (id) {
      // is the id a valid id?
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }

    return false;
  };

  const handleUpdateNote = async (item) => {
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
  };

  const handleAddNote = async (event) => {
    event.preventDefault();

    // check if we have an existing notem, if so update it
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = {
        note,
      };
      await API.graphql(graphqlOperation(createNote, { input }));

      setNote("");
    }
  };

  const handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  };

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      {/* Note Form */}
      <form className="mb3" onSubmit={handleAddNote}>
        <input
          type="text"
          className="pa2 f4"
          placeholder="write your note"
          onChange={handleChangeNote}
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
            <li className="list pa1 f3" onClick={() => handleSetNote(item)}>
              {item.note}
            </li>
            <button
              className="bg-transparent bn f4"
              onClick={() => handleDeleteNote(item.id)}
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withAuthenticator(App, { includeGreetings: true });
