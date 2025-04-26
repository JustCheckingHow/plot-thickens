import React, { useState } from "react";

export type ModalVisibleType =
  | "characters"
  | "graphs"
  | "locations"
  | "character_relationship_graph"
  | "plot_points"
  | "timeline_summary"
  | null;

export interface ModalContextType {
  modalVisible: ModalVisibleType;
  setModalVisible: React.Dispatch<React.SetStateAction<ModalVisibleType>>;
}

export const ModalContext = React.createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [modalVisible, setModalVisible] = useState<ModalVisibleType>(null);
        
    return (
        <ModalContext.Provider value={{ modalVisible, setModalVisible }}>
                {children}
        </ModalContext.Provider>
    );
};