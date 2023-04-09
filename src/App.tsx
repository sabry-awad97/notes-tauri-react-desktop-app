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
              <Button variant="light" leftIcon={<IconFileArrowLeft />}>
                Import
              </Button>
              <Button variant="light" leftIcon={<IconFileArrowRight />}>
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
              <TextInput mb={5} />
              <Textarea minRows={10} />
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
