import Markdown from 'react-markdown'

const CharacterSummary = ({character_summary} : {character_summary: string}) => {
    return (
        <div>
            <h2>Character Summary</h2>
            <Markdown>{character_summary}</Markdown>
        </div>
    )
}

export default CharacterSummary