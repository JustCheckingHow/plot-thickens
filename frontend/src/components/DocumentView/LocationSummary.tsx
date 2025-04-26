import Markdown from 'react-markdown'

const LocationSummary = ({location_summary} : {location_summary: string}) => {
    return (
        <div>
            <h2>Location Summary</h2>
            <Markdown>{location_summary}</Markdown>
        </div>
    )
}

export default LocationSummary