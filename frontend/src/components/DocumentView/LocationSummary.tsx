import ReactMarkdown from 'react-markdown'

const LocationSummary = ({location_summary} : {location_summary: string}) => {
    return (
        <div>
            <h2>Location Summary</h2>
            {location_summary.split('\n\n').map((paragraph, index) => (
                <>
                    <ReactMarkdown key={index}>{paragraph}</ReactMarkdown>
                    <br />
                </>
            ))}
        </div>
    )
}

export default LocationSummary