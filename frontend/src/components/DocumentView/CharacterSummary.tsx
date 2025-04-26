import ReactMarkdown from 'react-markdown'

const CharacterSummary = ({character_summary} : {character_summary: string}) => {
    return (
        <div>
            <h2>Character Summary</h2>
            {character_summary.split('\n\n').map((paragraph, index) => (
                <>
                    <ReactMarkdown key={index}>{paragraph}</ReactMarkdown>
                    <br />
                </>
            ))}
        </div>
    )
}

export default CharacterSummary