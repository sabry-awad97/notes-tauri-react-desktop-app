// Import necessary dependencies
import { useState } from 'react';
import Markdown from 'marked-react';

import {
  ThemeIcon,
  Button,
  CloseButton,
  Switch,
  NavLink,
  Flex,
  Grid,
  Divider,
  Paper,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  IconNotebook,
  IconFilePlus,
  IconFileArrowLeft,
  IconFileArrowRight,
} from '@tabler/icons-react';

import { save, open, ask } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import { sendNotification } from '@tauri-apps/api/notification';

// Define the main App component
function App() {
  // Use the useLocalStorage hook to store and retrieve notes from local storage
  const [notes, setNotes] = useLocalStorage({
    key: 'my-notes',
    defaultValue: [
      {
        title: 'New note',
        content: '',
      },
    ],
  });

  // Define state variables for the active note, its title and content, and the editor/preview toggle
  const [active, setActive] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checked, setChecked] = useState(false);

  // Function to handle note selection
  const handleSelection = (title: string, content: string, index: number) => {
    setTitle(title);
    setContent(content);
    setActive(index);
  };

  // Function to add a new note
  const addNote = () => {
    notes.splice(0, 0, { title: 'New note', content: '' });
    handleSelection('New note', '', 0);
    setNotes([...notes]);
  };

  // Function to delete a note
  const deleteNote = async (index: number) => {
    // Use the ask function from the Tauri API to confirm note deletion
    let deleteNote = await ask('Are you sure you want to delete this note?', {
      title: 'My Notes',
      type: 'warning',
    });
    if (deleteNote) {
      // Remove the note from the notes array
      notes.splice(index, 1);
      if (active >= index) {
        setActive(active >= 1 ? active - 1 : 0);
      }
      // If there are still notes remaining, set the content to the previous note's content
      if (notes.length >= 1) {
        setContent(notes[index - 1].content);
      } else {
        // If there are no more notes, reset the title and content
        setTitle('');
        setContent('');
      }
      // Update the notes array in local storage
      setNotes([...notes]);
    }
  };

  // Function to update the title of a note
  const updateNoteTitle = ({
    target: { value },
  }: {
    target: { value: string };
  }) => {
    // Update the title of the active note in the notes array
    notes.splice(active, 1, { title: value, content: content });
    // Update the title state variable
    setTitle(value);
    // Update the notes array in local storage
    setNotes([...notes]);
  };

  const updateNoteContent = ({
    target: { value },
  }: {
    target: { value: string };
  }) => {
    // Update the content of the active note in the notes array
    notes.splice(active, 1, { title: title, content: value });
    // Update the content state variable
    setContent(value);
    // Update the notes array in local storage
    setNotes([...notes]);
  };

  // Function to export notes to a JSON file
  const exportNotes = async () => {
    // Convert the notes array to a JSON string
    const exportedNotes = JSON.stringify(notes);

    // Use the save function from the Tauri API to prompt the user to select a file location to save the notes
    const filePath = await save({
      filters: [
        {
          name: 'JSON',
          extensions: ['json'],
        },
      ],
    });

    // Write the JSON string to the selected file location
    await writeTextFile(`${filePath}`, exportedNotes);

    // Send a notification to the user confirming that the notes have been saved
    sendNotification(
      `Your notes have been successfully saved in ${filePath} file.`
    );
  };

  // Function to import notes from a JSON file
  const importNotes = async () => {

    // Use the open function from the Tauri API to prompt the user to select a JSON file to import
    const selectedFile = await open({
      filters: [
        {
          name: 'JSON',
          extensions: ['json'],
        },
      ],
    });

    // Read the contents of the selected file
    const fileContent = await readTextFile(`${selectedFile}`);

    // Parse the JSON string into an array of notes
    const importedNotes = JSON.parse(fileContent);

    // Update the notes array in local storage with the imported notes
    setNotes(importedNotes);
  };

  // Render the main App component
  return (
    <div>
      <Grid grow m={10}>
        {/* Left column */}
        <Grid.Col span="auto">
          {/* Header section with app title and buttons */}
          <Flex gap="xl" justify="flex-start" align="center" wrap="wrap">
            <Flex>
              <ThemeIcon
                size="lg"
                variant="gradient"
                gradient={{ from: 'teal', to: 'lime', deg: 90 }}
              >
                <IconNotebook size={32} />
              </ThemeIcon>
              <Text color="green" fz="xl" fw={500} ml={5}>
                My Notes
              </Text>
            </Flex>
            <Button onClick={addNote} leftIcon={<IconFilePlus />}>
              Add note
            </Button>
            <Button.Group>
              <Button
                variant="light"
                onClick={importNotes}
                leftIcon={<IconFileArrowLeft />}
              >
                Import
              </Button>
              <Button
                variant="light"
                onClick={exportNotes}
                leftIcon={<IconFileArrowRight />}
              >
                Export
              </Button>
            </Button.Group>
          </Flex>

          <Divider my="sm" />

          {/* Render the list of notes */}
          {notes.map((note, index) => (
            <Flex key={index}>
              <NavLink
                onClick={() => handleSelection(note.title, note.content, index)}
                active={index === active}
                label={note.title}
              />
              <CloseButton
                onClick={() => deleteNote(index)}
                title="Delete note"
                size="xl"
                iconSize={20}
              />
            </Flex>
          ))}
        </Grid.Col>

        {/* Right column */}
        <Grid.Col span={2}>
          {/* Editor/preview toggle */}
          <Switch
            label="Toggle Editor / Markdown Preview"
            checked={checked}
            onChange={event => setChecked(event.currentTarget.checked)}
          />

          <Divider my="sm" />

          {/* Render the editor or preview*/}
          {checked === false && (
            <div>
              <TextInput value={title} onChange={updateNoteTitle} mb={5} />
              <Textarea
                value={content}
                onChange={updateNoteContent}
                minRows={10}
              />
            </div>
          )}
          {checked && (
            <Paper shadow="lg" p={10}>
              <Text fz="xl" fw={500} tt="capitalize">
                {title}
              </Text>

              <Divider my="sm" />

              {/* Render the Markdown preview */}
              <Markdown>{content}</Markdown>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </div>
  );
}

// Export the App component as the default export
export default App;
